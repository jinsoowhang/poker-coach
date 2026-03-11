import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import {
  GameLoop,
  Player,
  Card,
  GameEvent,
  ValidAction,
  PlayerAction,
  HandSummary,
  HandWinner,
} from '@poker-coach/engine';
import {
  ConnectedPlayer,
  broadcastMessage,
  leaveRoom,
  updateRoomStatus,
  getPresencePlayers,
} from '../lib/room-service';
import { saveHand } from '../lib/persistence';
import { usePlayerStore } from './usePlayerStore';
import { useSessionStore } from './useSessionStore';

export type RoomStatus = 'idle' | 'waiting' | 'playing' | 'finished';

interface MultiplayerStore {
  // Room state
  roomId: string | null;
  roomCode: string | null;
  isHost: boolean;
  roomStatus: RoomStatus;
  connectedPlayers: ConnectedPlayer[];
  channel: RealtimeChannel | null;
  hostId: string | null;

  // Game state (same shape as useGameStore)
  players: Player[];
  communityCards: Card[];
  pot: number;
  dealerIndex: number;
  currentPlayerIndex: number;
  street: string;
  handNumber: number;
  isHandOver: boolean;
  showdown: boolean;
  winners: HandWinner[];
  lastHandSummary: HandSummary | null;
  eventLog: GameEvent[];

  // Human input
  awaitingInput: boolean;
  validActions: ValidAction[];
  pendingResolve: ((action: PlayerAction) => void) | null;

  // Multiplayer-specific
  gameLoop: GameLoop | null;
  isRunning: boolean;
  disconnectedPlayers: Set<string>;
  hostDisconnected: boolean;
  actionTimeoutId: ReturnType<typeof setTimeout> | null;

  // Actions
  setRoom: (roomId: string, roomCode: string, channel: RealtimeChannel, isHost: boolean, hostId: string) => void;
  setupChannelListeners: () => void;
  startGame: () => void;
  playNextHand: () => Promise<void>;
  submitAction: (action: PlayerAction) => void;
  cleanup: () => void;
}

export const useMultiplayerStore = create<MultiplayerStore>((set, get) => ({
  // Room state
  roomId: null,
  roomCode: null,
  isHost: false,
  roomStatus: 'idle',
  connectedPlayers: [],
  channel: null,
  hostId: null,

  // Game state
  players: [],
  communityCards: [],
  pot: 0,
  dealerIndex: 0,
  currentPlayerIndex: 0,
  street: 'preflop',
  handNumber: 0,
  isHandOver: false,
  showdown: false,
  winners: [],
  lastHandSummary: null,
  eventLog: [],

  // Human input
  awaitingInput: false,
  validActions: [],
  pendingResolve: null,

  // Multiplayer-specific
  gameLoop: null,
  isRunning: false,
  disconnectedPlayers: new Set(),
  hostDisconnected: false,
  actionTimeoutId: null,

  setRoom: (roomId, roomCode, channel, isHost, hostId) => {
    set({ roomId, roomCode, channel, isHost, roomStatus: 'waiting', hostId });
    get().setupChannelListeners();
  },

  setupChannelListeners: () => {
    const { channel, isHost } = get();
    if (!channel) return;

    // Presence sync — update connected players list
    channel.on('presence', { event: 'sync' }, () => {
      const players = getPresencePlayers(channel);
      set({ connectedPlayers: players });
    });

    // Presence leave — detect disconnects
    channel.on('presence', { event: 'leave' }, ({ leftPresences }) => {
      const left = leftPresences as unknown as Array<{ playerId: string }>;
      for (const p of left) {
        const { hostId, roomStatus } = get();
        if (p.playerId === hostId && roomStatus === 'playing') {
          set({ hostDisconnected: true });
        } else if (roomStatus === 'playing') {
          set(s => {
            const newDisconnected = new Set(s.disconnectedPlayers);
            newDisconnected.add(p.playerId);
            return { disconnectedPlayers: newDisconnected };
          });
        }
      }
    });

    // Presence join — reconnect detection
    channel.on('presence', { event: 'join' }, ({ newPresences }) => {
      const joined = newPresences as unknown as Array<{ playerId: string }>;
      for (const p of joined) {
        set(s => {
          const newDisconnected = new Set(s.disconnectedPlayers);
          newDisconnected.delete(p.playerId);
          return { disconnectedPlayers: newDisconnected };
        });
      }
    });

    if (!isHost) {
      // Non-host: listen for game events from host
      channel.on('broadcast', { event: 'game_event' }, ({ payload }) => {
        const event = payload as GameEvent;
        handleGameEvent(event, set, get);
      });

      // Non-host: listen for awaiting_input
      channel.on('broadcast', { event: 'awaiting_input' }, ({ payload }) => {
        const { playerId, validActions } = payload as { playerId: string; validActions: ValidAction[] };
        const localPlayerId = usePlayerStore.getState().playerId;
        if (playerId === localPlayerId) {
          set({ awaitingInput: true, validActions });
        }
      });

      // Non-host: listen for game_start
      channel.on('broadcast', { event: 'game_start' }, () => {
        set({ roomStatus: 'playing', isRunning: true });
      });

      // Non-host: listen for game_over
      channel.on('broadcast', { event: 'game_over' }, () => {
        set({ roomStatus: 'finished', isRunning: false, isHandOver: true });
      });
    }

    if (isHost) {
      // Host: listen for player_action from remote players
      channel.on('broadcast', { event: 'player_action' }, ({ payload }) => {
        const { action } = payload as { playerId: string; action: PlayerAction };
        const { pendingResolve, actionTimeoutId } = get();
        if (pendingResolve) {
          if (actionTimeoutId) clearTimeout(actionTimeoutId);
          set({ awaitingInput: false, validActions: [], pendingResolve: null, actionTimeoutId: null });
          pendingResolve(action);
        }
      });
    }
  },

  startGame: () => {
    const { channel, connectedPlayers, roomId, isHost } = get();
    if (!isHost || !channel) return;

    // Create players from connected players
    const gamePlayers: Player[] = connectedPlayers.map((cp, i) => ({
      id: cp.id,
      name: cp.name,
      chips: 1000,
      holeCards: null,
      currentBet: 0,
      totalBetThisRound: 0,
      folded: false,
      allIn: false,
      seatIndex: i,
      isHuman: true, // All players are human in MP
    }));

    const localPlayerId = usePlayerStore.getState().playerId;

    const loop = new GameLoop({
      players: gamePlayers,
      smallBlind: 5,
      bigBlind: 10,
      onEvent: (event: GameEvent) => {
        // Update local store state
        handleGameEvent(event, set, get);
        // Broadcast to all clients
        broadcastMessage(channel, { type: 'game_event', payload: event });
      },
      getAction: async (playerId, validActions, gameState) => {
        // Update displayed state
        set({
          players: gameState.players.map(p => ({ ...p })),
          currentPlayerIndex: gameState.currentPlayerIndex,
          dealerIndex: gameState.dealerIndex,
          handNumber: gameState.handNumber,
          street: gameState.street,
        });

        if (playerId === localPlayerId) {
          // Host's own action — use local UI Promise
          return new Promise<PlayerAction>((resolve) => {
            set({
              awaitingInput: true,
              validActions,
              pendingResolve: resolve,
            });
          });
        }

        // Remote player — broadcast awaiting_input, wait for player_action
        broadcastMessage(channel, {
          type: 'awaiting_input',
          payload: { playerId, validActions },
        });

        return new Promise<PlayerAction>((resolve) => {
          // Set up timeout (60s auto-fold)
          const timeoutId = setTimeout(() => {
            const fold = validActions.find(a => a.type === 'fold');
            const check = validActions.find(a => a.type === 'check');
            if (fold) {
              resolve({ type: 'fold', amount: 0 });
            } else if (check) {
              resolve({ type: 'check', amount: 0 });
            }
            set({ pendingResolve: null, actionTimeoutId: null });
          }, 60000);

          set({ pendingResolve: resolve, actionTimeoutId: timeoutId });
        });
      },
    });

    // Update room status
    if (roomId) updateRoomStatus(roomId, 'playing');

    // Broadcast game_start
    broadcastMessage(channel, {
      type: 'game_start',
      payload: { players: connectedPlayers.map(p => ({ id: p.id, name: p.name })) },
    });

    set({
      gameLoop: loop,
      players: gamePlayers,
      isRunning: true,
      roomStatus: 'playing',
      handNumber: 0,
      eventLog: [],
    });

    // Start persistence session
    const pid = usePlayerStore.getState().playerId;
    if (pid) {
      useSessionStore.getState().startSession(pid, 1000);
    }

    // Auto-start first hand
    get().playNextHand();
  },

  playNextHand: async () => {
    const loop = get().gameLoop;
    if (!loop) return;

    set({ isHandOver: false, awaitingInput: false, showdown: false, eventLog: [] });
    await loop.playHand();
  },

  submitAction: (action: PlayerAction) => {
    const { isHost, pendingResolve, channel } = get();

    if (isHost) {
      // Host resolves locally
      if (pendingResolve) {
        const { actionTimeoutId } = get();
        if (actionTimeoutId) clearTimeout(actionTimeoutId);
        set({ awaitingInput: false, validActions: [], pendingResolve: null, actionTimeoutId: null });
        pendingResolve(action);
      }
    } else {
      // Non-host broadcasts action to host
      if (channel) {
        const localPlayerId = usePlayerStore.getState().playerId;
        broadcastMessage(channel, {
          type: 'player_action',
          payload: { playerId: localPlayerId!, action },
        });
        set({ awaitingInput: false, validActions: [] });
      }
    }
  },

  cleanup: () => {
    const { channel, actionTimeoutId, roomId, isHost } = get();
    if (actionTimeoutId) clearTimeout(actionTimeoutId);
    if (isHost && roomId) updateRoomStatus(roomId, 'finished');
    leaveRoom(channel);
    set({
      roomId: null,
      roomCode: null,
      isHost: false,
      roomStatus: 'idle',
      connectedPlayers: [],
      channel: null,
      hostId: null,
      players: [],
      communityCards: [],
      pot: 0,
      dealerIndex: 0,
      currentPlayerIndex: 0,
      street: 'preflop',
      handNumber: 0,
      isHandOver: false,
      showdown: false,
      winners: [],
      lastHandSummary: null,
      eventLog: [],
      awaitingInput: false,
      validActions: [],
      pendingResolve: null,
      gameLoop: null,
      isRunning: false,
      disconnectedPlayers: new Set(),
      hostDisconnected: false,
      actionTimeoutId: null,
    });
  },
}));

// Shared event handler for both host and non-host
function handleGameEvent(
  event: GameEvent,
  set: (partial: Partial<MultiplayerStore> | ((s: MultiplayerStore) => Partial<MultiplayerStore>)) => void,
  get: () => MultiplayerStore,
): void {
  // Log event
  set(s => ({ eventLog: [...s.eventLog, event] }));

  switch (event.type) {
    case 'HAND_START':
      set({
        players: event.players.map(p => ({ ...p })),
        communityCards: [],
        pot: 0,
        isHandOver: false,
        showdown: false,
        winners: [],
        lastHandSummary: null,
      });
      break;

    case 'CARDS_DEALT':
      set(s => ({
        players: s.players.map(p =>
          p.id === event.playerId ? { ...p, holeCards: event.cards } : p,
        ),
      }));
      break;

    case 'COMMUNITY_CARDS':
      set({ communityCards: event.cards });
      break;

    case 'STREET_CHANGE':
      set({ street: event.street });
      break;

    case 'POT_UPDATE':
      set({ pot: event.pot });
      break;

    case 'SHOWDOWN':
      set({ showdown: true, winners: event.winners });
      break;

    case 'HAND_END':
      set(s => ({
        isHandOver: true,
        lastHandSummary: event.summary,
        players: event.summary.playerResults.map((pr, i) => {
          const existing = s.players[i];
          return {
            ...existing,
            chips: pr.chipsAfter,
            holeCards: pr.holeCards,
            folded: pr.folded,
          };
        }),
      }));

      // Persist hand for local player
      {
        const pid = usePlayerStore.getState().playerId;
        const sid = useSessionStore.getState().sessionId;
        if (pid && sid) {
          const state = get();
          const heroPlayer = state.players.find(p => p.id === pid);
          if (heroPlayer) {
            saveHand(
              pid,
              sid,
              event.summary,
              state.eventLog,
              heroPlayer.id,
              state.dealerIndex,
              state.players.length,
              heroPlayer.seatIndex ?? 0,
            );
            useSessionStore.getState().incrementHands();
          }
        }
      }
      break;
  }
}

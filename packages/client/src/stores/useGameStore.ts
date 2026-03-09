import { create } from 'zustand';
import {
  GameLoop,
  Player,
  Card,
  GameEvent,
  ValidAction,
  PlayerAction,
  HandSummary,
  HandWinner,
  GameState,
  TAG,
  LP,
  LAG,
  createAiActionProvider,
  getActionDelay,
} from '@poker-coach/engine';
import { saveHand } from '../lib/persistence';
import { computeAndSaveSnapshot } from '../lib/skill-calculator';
import { usePlayerStore } from './usePlayerStore';
import { useSessionStore } from './useSessionStore';

export type AnimationPhase = 'idle' | 'dealing' | 'community' | 'showdown';

interface GameStore {
  // Game state
  players: Player[];
  communityCards: Card[];
  pot: number;
  dealerIndex: number;
  currentPlayerIndex: number;
  street: string;
  handNumber: number;
  isHandOver: boolean;
  showdown: boolean;

  // Animation
  animationPhase: AnimationPhase;

  // Human input
  awaitingInput: boolean;
  validActions: ValidAction[];
  pendingResolve: ((action: PlayerAction) => void) | null;

  // Hand history
  lastHandSummary: HandSummary | null;
  eventLog: GameEvent[];
  winners: HandWinner[];

  // AI thinking
  thinkingPlayerId: string | null;

  // Game running
  gameLoop: GameLoop | null;
  isRunning: boolean;

  // Actions
  startGame: () => void;
  playNextHand: () => Promise<void>;
  submitAction: (action: PlayerAction) => void;
}

const AI_PERSONALITIES = [TAG, LP, LAG];
const AI_NAMES = ['Alex (TAG)', 'Casey (LP)', 'Morgan (LAG)'];

function createPlayers(): Player[] {
  const human: Player = {
    id: 'human',
    name: 'You',
    chips: 1000,
    holeCards: null,
    currentBet: 0,
    totalBetThisRound: 0,
    folded: false,
    allIn: false,
    seatIndex: 0,
    isHuman: true,
  };

  const ais: Player[] = AI_PERSONALITIES.map((_, i) => ({
    id: `ai-${i}`,
    name: AI_NAMES[i],
    chips: 1000,
    holeCards: null,
    currentBet: 0,
    totalBetThisRound: 0,
    folded: false,
    allIn: false,
    seatIndex: i + 1,
    isHuman: false,
  }));

  return [human, ...ais];
}

const aiProviders = AI_PERSONALITIES.map(p => createAiActionProvider(p));

export const useGameStore = create<GameStore>((set, get) => ({
  players: [],
  communityCards: [],
  pot: 0,
  dealerIndex: 0,
  currentPlayerIndex: 0,
  street: 'preflop',
  handNumber: 0,
  isHandOver: false,
  showdown: false,

  awaitingInput: false,
  validActions: [],
  pendingResolve: null,

  lastHandSummary: null,
  eventLog: [],
  winners: [],

  thinkingPlayerId: null,

  animationPhase: 'idle' as AnimationPhase,

  gameLoop: null,
  isRunning: false,

  startGame: () => {
    const players = createPlayers();

    const loop = new GameLoop({
      players,
      smallBlind: 5,
      bigBlind: 10,
      onEvent: (event: GameEvent) => {
        const state = get();

        // Log event
        set({ eventLog: [...state.eventLog, event] });

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
              animationPhase: 'dealing',
            });
            // Reset to idle after deal animations complete (~1s for 4 players)
            setTimeout(() => {
              if (get().animationPhase === 'dealing') {
                set({ animationPhase: 'idle' });
              }
            }, 1000);
            break;

          case 'CARDS_DEALT':
            set(s => ({
              players: s.players.map(p =>
                p.id === event.playerId
                  ? { ...p, holeCards: event.cards }
                  : p,
              ),
            }));
            break;

          case 'COMMUNITY_CARDS':
            set({ communityCards: event.cards, animationPhase: 'community' });
            // Reset after community card animations (~500ms)
            setTimeout(() => {
              if (get().animationPhase === 'community') {
                set({ animationPhase: 'idle' });
              }
            }, 600);
            break;

          case 'STREET_CHANGE':
            set({ street: event.street });
            break;

          case 'PLAYER_ACTION':
            // State is updated via POT_UPDATE and the game loop
            break;

          case 'POT_UPDATE':
            set({ pot: event.pot });
            break;

          case 'AWAITING_INPUT':
            // Handled by getAction
            break;

          case 'SHOWDOWN':
            set({ showdown: true, winners: event.winners, animationPhase: 'showdown' });
            // Reset after showdown animations (~2s for flip + glow)
            setTimeout(() => {
              if (get().animationPhase === 'showdown') {
                set({ animationPhase: 'idle' });
              }
            }, 2000);
            break;

          case 'HAND_END':
            set({
              isHandOver: true,
              lastHandSummary: event.summary,
              // Sync final player state from summary
              players: event.summary.playerResults.map((pr, i) => {
                const existing = get().players[i];
                return {
                  ...existing,
                  chips: pr.chipsAfter,
                  holeCards: pr.holeCards,
                  folded: pr.folded,
                };
              }),
            });

            // Persist hand to Supabase (fire-and-forget)
            {
              const pid = usePlayerStore.getState().playerId;
              const sid = useSessionStore.getState().sessionId;
              if (pid && sid) {
                const heroPlayer = state.players.find(p => p.isHuman);
                if (heroPlayer) {
                  saveHand(
                    pid,
                    sid,
                    event.summary,
                    get().eventLog,
                    heroPlayer.id,
                    state.dealerIndex,
                    state.players.length,
                    heroPlayer.seatIndex ?? 0,
                  );
                  useSessionStore.getState().incrementHands();

                  // Compute skill snapshot every 10 hands
                  const { handsPlayed } = useSessionStore.getState();
                  if (handsPlayed > 0 && handsPlayed % 10 === 0) {
                    computeAndSaveSnapshot(pid); // fire and forget
                  }
                }
              }
            }
            break;
        }
      },
      getAction: async (playerId, validActions, gameState) => {
        // Update displayed state from the engine's current state
        set({
          players: gameState.players.map(p => ({ ...p })),
          currentPlayerIndex: gameState.currentPlayerIndex,
          dealerIndex: gameState.dealerIndex,
          handNumber: gameState.handNumber,
          street: gameState.street,
        });

        if (playerId === 'human') {
          // Wait for human input
          return new Promise<PlayerAction>((resolve) => {
            set({
              awaitingInput: true,
              validActions,
              pendingResolve: resolve,
            });
          });
        }

        // AI action with variable delay based on action type and personality
        set({ thinkingPlayerId: playerId });
        const aiIndex = parseInt(playerId.split('-')[1]);
        const personality = AI_PERSONALITIES[aiIndex];
        const aiAction = await aiProviders[aiIndex](playerId, validActions, gameState);
        const delay = getActionDelay(aiAction.type, personality);
        await new Promise(r => setTimeout(r, delay));
        set({ thinkingPlayerId: null });
        return aiAction;
      },
    });

    set({ gameLoop: loop, players, isRunning: true, handNumber: 0, eventLog: [] });

    // Start a persistence session (fire-and-forget)
    const playerId = usePlayerStore.getState().playerId;
    if (playerId) {
      useSessionStore.getState().startSession(playerId, 1000);
    }

    // Auto-start first hand
    get().playNextHand();
  },

  playNextHand: async () => {
    const loop = get().gameLoop;
    if (!loop) return;

    set({ isHandOver: false, awaitingInput: false, showdown: false });
    await loop.playHand();
  },

  submitAction: (action: PlayerAction) => {
    const { pendingResolve } = get();
    if (pendingResolve) {
      set({ awaitingInput: false, validActions: [], pendingResolve: null });
      pendingResolve(action);
    }
  },
}));

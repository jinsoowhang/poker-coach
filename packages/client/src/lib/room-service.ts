import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { GameEvent, ValidAction, PlayerAction } from '@poker-coach/engine';

// Channel broadcast event types
export interface GameEventMessage {
  type: 'game_event';
  payload: GameEvent;
}

export interface AwaitingInputMessage {
  type: 'awaiting_input';
  payload: { playerId: string; validActions: ValidAction[] };
}

export interface PlayerActionMessage {
  type: 'player_action';
  payload: { playerId: string; action: PlayerAction };
}

export interface GameStartMessage {
  type: 'game_start';
  payload: { players: { id: string; name: string }[] };
}

export interface GameOverMessage {
  type: 'game_over';
  payload: Record<string, never>;
}

export type RoomMessage =
  | GameEventMessage
  | AwaitingInputMessage
  | PlayerActionMessage
  | GameStartMessage
  | GameOverMessage;

export interface ConnectedPlayer {
  id: string;
  name: string;
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for readability

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  }
  return code;
}

export async function createRoom(hostPlayerId: string, displayName: string): Promise<{
  roomId: string;
  roomCode: string;
  channel: RealtimeChannel;
} | null> {
  if (!supabase) return null;

  const code = generateRoomCode();

  const { data, error } = await supabase
    .from('rooms')
    .insert({ code, host_id: hostPlayerId })
    .select('id, code')
    .single();

  if (error || !data) {
    console.error('Failed to create room:', error);
    return null;
  }

  const channel = supabase.channel(`room:${data.code}`, {
    config: { presence: { key: hostPlayerId } },
  });

  await channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ playerId: hostPlayerId, displayName });
    }
  });

  return { roomId: data.id, roomCode: data.code, channel };
}

export async function joinRoom(code: string, playerId: string, displayName: string): Promise<{
  roomId: string;
  roomCode: string;
  channel: RealtimeChannel;
  hostId: string;
} | null> {
  if (!supabase) return null;

  const { data: room, error } = await supabase
    .from('rooms')
    .select('id, code, host_id, status, max_players')
    .eq('code', code.toUpperCase())
    .single();

  if (error || !room) return null;
  if (room.status !== 'waiting') return null;

  const channel = supabase.channel(`room:${room.code}`, {
    config: { presence: { key: playerId } },
  });

  await channel.subscribe(async (status) => {
    if (status === 'SUBSCRIBED') {
      await channel.track({ playerId, displayName });
    }
  });

  // Check player count after subscribing
  const presenceState = channel.presenceState();
  const playerCount = Object.keys(presenceState).length;
  if (playerCount > room.max_players) {
    channel.unsubscribe();
    return null;
  }

  return { roomId: room.id, roomCode: room.code, channel, hostId: room.host_id };
}

export function leaveRoom(channel: RealtimeChannel | null): void {
  if (channel) {
    channel.untrack();
    channel.unsubscribe();
  }
}

export function broadcastMessage(channel: RealtimeChannel, message: RoomMessage): void {
  channel.send({
    type: 'broadcast',
    event: message.type,
    payload: message.payload,
  });
}

export async function updateRoomStatus(roomId: string, status: 'waiting' | 'playing' | 'finished'): Promise<void> {
  if (!supabase) return;
  await supabase.from('rooms').update({ status }).eq('id', roomId);
}

export function getPresencePlayers(channel: RealtimeChannel): ConnectedPlayer[] {
  const state = channel.presenceState();
  const players: ConnectedPlayer[] = [];

  for (const key of Object.keys(state)) {
    const presences = state[key] as unknown as Array<{ playerId: string; displayName: string }>;
    if (presences.length > 0) {
      players.push({ id: presences[0].playerId, name: presences[0].displayName });
    }
  }

  return players;
}

import { supabase } from './supabase';

export interface PlayerStats {
  player_id: string;
  display_name: string;
  hands_played: number;
  win_rate: number;
  vpip: number;
  aggression: number;
  showdown_win_pct: number;
  avg_profit: number;
  skill_score: number;
}

export interface HandRecord {
  id: string;
  hand_number: number;
  pot_total: number;
  hero_hole_cards: any;
  hero_position: string;
  hero_actions: any[];
  hero_chips_before: number;
  hero_chips_after: number;
  hero_folded: boolean;
  community_cards: any[];
  winners: any[];
  created_at: string;
}

export interface SkillSnapshot {
  hands_total: number;
  skill_score: number;
  vpip: number;
  aggression: number;
  win_rate: number;
  created_at: string;
}

export async function fetchLeaderboard(): Promise<PlayerStats[]> {
  if (!supabase) return [];
  const { data } = await supabase.from('leaderboard_stats').select('*').order('skill_score', { ascending: false });
  return data ?? [];
}

export async function fetchPlayerHands(playerId: string, limit = 20): Promise<HandRecord[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('hands')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function fetchSkillHistory(playerId: string): Promise<SkillSnapshot[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('skill_snapshots')
    .select('*')
    .eq('player_id', playerId)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function fetchChipHistory(playerId: string): Promise<{ hand_number: number; chips: number }[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('hands')
    .select('hand_number, hero_chips_after')
    .eq('player_id', playerId)
    .order('hand_number', { ascending: true });
  return (data ?? []).map(d => ({ hand_number: d.hand_number, chips: d.hero_chips_after }));
}

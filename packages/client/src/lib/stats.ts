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

export interface CalibrationBucket {
  confidence: number;    // 1-5
  total: number;
  correct: number;
  accuracy: number;      // 0-1
  expectedAccuracy: number; // what a well-calibrated player would achieve
}

export interface ScenarioStats {
  total: number;
  correct: number;
  accuracy: number; // 0-1
  byCategory: Record<string, { total: number; correct: number }>;
  calibration: CalibrationBucket[];  // always length 5, zero-filled
  /**
   * Brier-style calibration error: mean((stated_prob − actual)²).
   * 0 = perfectly calibrated. Higher = worse calibration.
   * null if no attempts with confidence recorded.
   */
  brier: number | null;
  confidenceTotal: number; // number of attempts that have confidence
}

// Map confidence (1-5) to stated probability of correctness.
// Roughly: Guess=25%, Unsure=45%, Hunch=60%, Confident=80%, Certain=95%.
const CONFIDENCE_TO_PROB: Record<number, number> = {
  1: 0.25,
  2: 0.45,
  3: 0.6,
  4: 0.8,
  5: 0.95,
};

export function confidenceToProb(confidence: number): number {
  return CONFIDENCE_TO_PROB[confidence] ?? 0.5;
}

export interface ScenarioStateRow {
  scenario_id: string;
  box: number;
  next_review_at: string;
}

/**
 * Scenario IDs whose SRS review is due (next_review_at <= now).
 * Ordered by most overdue first.
 */
export async function fetchDueScenarioIds(playerId: string): Promise<ScenarioStateRow[]> {
  if (!supabase) return [];
  const nowIso = new Date().toISOString();
  const { data } = await supabase
    .from('scenario_state')
    .select('scenario_id, box, next_review_at')
    .eq('player_id', playerId)
    .lte('next_review_at', nowIso)
    .order('next_review_at', { ascending: true });
  return data ?? [];
}

/**
 * Every scenario_id the player has a scenario_state row for — i.e. has
 * answered at least once. Used to resume a category at the first scenario
 * the player hasn't completed yet.
 */
export async function fetchCompletedScenarioIds(playerId: string): Promise<string[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from('scenario_state')
    .select('scenario_id')
    .eq('player_id', playerId);
  return (data ?? []).map((r) => r.scenario_id);
}

export async function fetchScenarioStats(playerId: string): Promise<ScenarioStats> {
  const empty: ScenarioStats = {
    total: 0,
    correct: 0,
    accuracy: 0,
    byCategory: {},
    calibration: [1, 2, 3, 4, 5].map((c) => ({
      confidence: c,
      total: 0,
      correct: 0,
      accuracy: 0,
      expectedAccuracy: confidenceToProb(c),
    })),
    brier: null,
    confidenceTotal: 0,
  };
  if (!supabase) return empty;

  const { data } = await supabase
    .from('scenario_attempts')
    .select('category, is_correct, confidence')
    .eq('player_id', playerId);

  if (!data || data.length === 0) return empty;

  const byCategory: Record<string, { total: number; correct: number }> = {};
  const buckets: Record<number, { total: number; correct: number }> = {
    1: { total: 0, correct: 0 },
    2: { total: 0, correct: 0 },
    3: { total: 0, correct: 0 },
    4: { total: 0, correct: 0 },
    5: { total: 0, correct: 0 },
  };

  let correct = 0;
  let brierSum = 0;
  let confidenceTotal = 0;

  for (const row of data) {
    const cat = row.category as string;
    if (!byCategory[cat]) byCategory[cat] = { total: 0, correct: 0 };
    byCategory[cat].total++;
    if (row.is_correct) {
      byCategory[cat].correct++;
      correct++;
    }
    if (row.confidence != null && row.confidence >= 1 && row.confidence <= 5) {
      buckets[row.confidence].total++;
      if (row.is_correct) buckets[row.confidence].correct++;
      const prob = confidenceToProb(row.confidence);
      const actual = row.is_correct ? 1 : 0;
      brierSum += (prob - actual) ** 2;
      confidenceTotal++;
    }
  }

  const calibration: CalibrationBucket[] = [1, 2, 3, 4, 5].map((c) => {
    const b = buckets[c];
    return {
      confidence: c,
      total: b.total,
      correct: b.correct,
      accuracy: b.total > 0 ? b.correct / b.total : 0,
      expectedAccuracy: confidenceToProb(c),
    };
  });

  return {
    total: data.length,
    correct,
    accuracy: correct / data.length,
    byCategory,
    calibration,
    brier: confidenceTotal > 0 ? brierSum / confidenceTotal : null,
    confidenceTotal,
  };
}

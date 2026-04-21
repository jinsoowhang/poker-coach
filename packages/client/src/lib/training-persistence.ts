import { supabase } from './supabase';
import type { ScenarioCategory } from '../data/scenarios';
import { getNextBox, nextReviewDate } from './srs';
import { todayISO, updateStreak } from './streak';

export async function saveScenarioAttempt(
  playerId: string,
  scenarioId: string,
  category: ScenarioCategory,
  chosenIndex: number,
  correctIndex: number,
  confidence?: number,
): Promise<void> {
  if (!supabase) return;

  const isCorrect = chosenIndex === correctIndex;

  await supabase.from('scenario_attempts').insert({
    player_id: playerId,
    scenario_id: scenarioId,
    category,
    chosen_index: chosenIndex,
    correct_index: correctIndex,
    is_correct: isCorrect,
    confidence: confidence ?? null,
  });

  // Advance Leitner box state (fire-and-forget; ignore errors).
  await updateScenarioState(playerId, scenarioId, isCorrect);
}

async function updateScenarioState(
  playerId: string,
  scenarioId: string,
  isCorrect: boolean,
): Promise<void> {
  if (!supabase) return;

  const { data: existing } = await supabase
    .from('scenario_state')
    .select('box')
    .eq('player_id', playerId)
    .eq('scenario_id', scenarioId)
    .maybeSingle();

  const currentBox = existing?.box ?? 1;
  const nextBox = getNextBox(currentBox, isCorrect);
  const reviewAt = nextReviewDate(nextBox);

  await supabase.from('scenario_state').upsert(
    {
      player_id: playerId,
      scenario_id: scenarioId,
      box: nextBox,
      next_review_at: reviewAt.toISOString(),
      last_reviewed_at: new Date().toISOString(),
    },
    { onConflict: 'player_id,scenario_id' },
  );
}

export interface DailyHandResult {
  currentStreak: number;
  longestStreak: number;
  alreadyToday: boolean;
}

/**
 * Mark today's Daily Hand as completed by the player and update their streak.
 * Idempotent: calling twice in the same UTC day is a no-op for streak math.
 */
export async function markDailyHandCompleted(
  playerId: string,
): Promise<DailyHandResult | null> {
  if (!supabase) return null;

  const today = todayISO();
  const { data: player } = await supabase
    .from('players')
    .select(
      'current_streak, longest_streak, last_practice_date, daily_hand_completed_date',
    )
    .eq('id', playerId)
    .single();

  if (!player) return null;

  if (player.daily_hand_completed_date === today) {
    return {
      currentStreak: player.current_streak ?? 0,
      longestStreak: player.longest_streak ?? 0,
      alreadyToday: true,
    };
  }

  const updated = updateStreak({
    currentStreak: player.current_streak ?? 0,
    longestStreak: player.longest_streak ?? 0,
    lastPracticeDate: player.last_practice_date ?? null,
  });

  await supabase
    .from('players')
    .update({
      current_streak: updated.currentStreak,
      longest_streak: updated.longestStreak,
      last_practice_date: updated.lastPracticeDate,
      daily_hand_completed_date: today,
    })
    .eq('id', playerId);

  return {
    currentStreak: updated.currentStreak,
    longestStreak: updated.longestStreak,
    alreadyToday: false,
  };
}

import type { Scenario } from '../data/scenarios';

// ── Date helpers (UTC, to keep Daily Hand consistent across timezones) ─────

export function todayISO(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10); // YYYY-MM-DD
}

export function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00Z').getTime();
  const db = new Date(b + 'T00:00:00Z').getTime();
  return Math.round((db - da) / 86_400_000);
}

// ── Daily Hand selection ───────────────────────────────────────────────────

/**
 * Deterministically pick today's scenario from the pool, seeded by UTC date.
 * Same scenario for every user on a given day — Wordle-style.
 */
export function getDailyHandScenario(scenarios: Scenario[], date: string = todayISO()): Scenario {
  if (scenarios.length === 0) throw new Error('No scenarios available');
  // Simple deterministic hash: sum of char codes.
  let hash = 0;
  for (let i = 0; i < date.length; i++) {
    hash = (hash * 31 + date.charCodeAt(i)) >>> 0;
  }
  return scenarios[hash % scenarios.length];
}

// ── Streak calculation ─────────────────────────────────────────────────────

/**
 * Given a user's last practice date and today's date, compute the new streak values.
 *   - same day: no change (already counted today)
 *   - consecutive day: increment
 *   - skipped a day (or first ever): reset to 1
 */
export function updateStreak(
  current: { currentStreak: number; longestStreak: number; lastPracticeDate: string | null },
  today: string = todayISO(),
): { currentStreak: number; longestStreak: number; lastPracticeDate: string } {
  const { currentStreak, longestStreak, lastPracticeDate } = current;

  let nextCurrent: number;
  if (!lastPracticeDate) {
    nextCurrent = 1;
  } else {
    const gap = daysBetween(lastPracticeDate, today);
    if (gap === 0) {
      nextCurrent = currentStreak; // already banked today
    } else if (gap === 1) {
      nextCurrent = currentStreak + 1;
    } else {
      nextCurrent = 1; // missed at least one day — reset
    }
  }

  return {
    currentStreak: nextCurrent,
    longestStreak: Math.max(longestStreak, nextCurrent),
    lastPracticeDate: today,
  };
}

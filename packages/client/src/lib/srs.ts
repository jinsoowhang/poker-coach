/**
 * Leitner-box spaced-repetition helpers.
 *
 * 5 boxes with fixed intervals (in days). On each attempt:
 *   - correct → promote to next box (capped at 5)
 *   - wrong   → demote to box 1
 *
 * Chosen over SM-2/FSRS because at N≈24 scenarios the math is indistinguishable
 * and Leitner is trivial to debug. Upgrade to FSRS if we ever exceed ~100
 * scenarios × 100 attempts/user (per council's learning-science advice).
 */

export const BOX_INTERVALS_DAYS = [1, 3, 7, 14, 30] as const;
export const MIN_BOX = 1;
export const MAX_BOX = 5;

export function getNextBox(currentBox: number, isCorrect: boolean): number {
  if (!isCorrect) return MIN_BOX;
  return Math.min(currentBox + 1, MAX_BOX);
}

export function nextReviewDate(box: number, from: Date = new Date()): Date {
  const clamped = Math.max(MIN_BOX, Math.min(MAX_BOX, box));
  const days = BOX_INTERVALS_DAYS[clamped - 1];
  const out = new Date(from);
  out.setUTCDate(out.getUTCDate() + days);
  return out;
}

export function isDue(nextReviewAt: string | Date | null | undefined, now: Date = new Date()): boolean {
  if (!nextReviewAt) return true;
  const d = typeof nextReviewAt === 'string' ? new Date(nextReviewAt) : nextReviewAt;
  return d.getTime() <= now.getTime();
}

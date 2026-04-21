// ── Stack-to-Pot Ratio ──

export type SprTier = 'low' | 'medium' | 'high';

export interface SprAnalysis {
  spr: number;             // effective stack / pot, rounded to 1 decimal
  tier: SprTier;           // low: ≤3, medium: 4–8, high: ≥9
  commitment: string;      // plain-English commitment guidance
}

/**
 * Compute the Stack-to-Pot Ratio at the start of a postflop street.
 *
 *   SPR = effectiveStack / pot
 *
 * Tiering is standard NLHE heuristic:
 *   - Low SPR (≤ 3):   commit with TPTK / overpair; getting stacks in is natural
 *   - Medium SPR (4–8): need two-pair or better to stack off; pot-control one pair
 *   - High SPR (≥ 9):   need strong made hands or combo draws to play for stacks
 *
 * Zero or negative pot/stack returns a safe default (spr 0, low tier) rather than
 * throwing — makes this safe to use inside UI/explanations without guards.
 */
export function calculateSPR(effectiveStack: number, pot: number): SprAnalysis {
  if (pot <= 0 || effectiveStack <= 0) {
    return {
      spr: 0,
      tier: 'low',
      commitment: 'Pot or stack is zero — SPR undefined.',
    };
  }

  const rawSpr = effectiveStack / pot;
  const spr = Math.round(rawSpr * 10) / 10;

  if (spr <= 3) {
    return {
      spr,
      tier: 'low',
      commitment: 'Commit with top pair or overpair — stacks go in naturally.',
    };
  }

  if (spr <= 8) {
    return {
      spr,
      tier: 'medium',
      commitment: 'Need two-pair or better to stack off. Pot-control one-pair hands.',
    };
  }

  return {
    spr,
    tier: 'high',
    commitment: 'Need strong made hands or big combo draws to play for stacks.',
  };
}

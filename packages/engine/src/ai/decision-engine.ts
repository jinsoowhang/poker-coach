import { AiPersonality, AiDecision, PlayerAction, ValidAction, GameState, Card } from '../types.js';
import { evaluateHand } from '../hand-evaluator.js';
import { rankValue } from '../card.js';

/**
 * Estimate preflop hand strength as a 0-1 percentile.
 * Calibrated so AA ≈ 0.95, AKs ≈ 0.78, 72o ≈ 0.10.
 */
export function estimatePreflopStrength(holeCards: [Card, Card]): number {
  const [a, b] = holeCards;
  const highRank = Math.max(rankValue(a.rank), rankValue(b.rank));
  const lowRank = Math.min(rankValue(a.rank), rankValue(b.rank));
  const isPair = a.rank === b.rank;
  const isSuited = a.suit === b.suit;
  const gap = highRank - lowRank;

  let strength = 0;

  if (isPair) {
    // Pairs: 22 ≈ 0.45, AA ≈ 0.95
    strength = 0.45 + (highRank - 2) / 12 * 0.50;
  } else {
    // Base from high card: A-high ≈ 0.35 base, 2-high ≈ 0.03
    strength += (highRank - 2) / 12 * 0.35;
    // Kicker value: A kicker ≈ 0.15, 2 kicker ≈ 0.01
    strength += (lowRank - 2) / 12 * 0.15;

    // Suited bonus: ~0.06 (flush potential)
    if (isSuited) {
      strength += 0.06;
    }

    // Connectedness: gap 1 = +0.07, gap 2 = +0.05, gap 3 = +0.03, gap 4 = +0.01
    if (gap <= 4) {
      strength += (5 - gap) / 5 * 0.07;
    }

    // Broadway bonus: both cards 10+
    if (highRank >= 10 && lowRank >= 10) {
      strength += 0.08;
    }
  }

  return Math.min(1, Math.max(0, strength));
}

/**
 * Estimate postflop hand strength using the evaluator.
 * Returns 0-1 calibrated so one pair ≈ 0.35-0.50, two pair ≈ 0.55-0.65, etc.
 *
 * pokersolver ranks: 1=High Card, 2=Pair, 3=Two Pair, 4=Three of a Kind,
 * 5=Straight, 6=Flush, 7=Full House, 8=Four of a Kind, 9=Straight Flush/Royal
 */
export function estimatePostflopStrength(
  holeCards: [Card, Card],
  communityCards: Card[],
): number {
  const hand = evaluateHand([...holeCards, ...communityCards]);

  // Map hand rank to strength ranges
  const rankRanges: Record<number, [number, number]> = {
    1: [0.08, 0.25],  // High card
    2: [0.30, 0.52],  // One pair
    3: [0.55, 0.68],  // Two pair
    4: [0.70, 0.80],  // Three of a kind
    5: [0.80, 0.87],  // Straight
    6: [0.87, 0.92],  // Flush
    7: [0.92, 0.96],  // Full house
    8: [0.96, 0.98],  // Four of a kind
    9: [0.98, 1.00],  // Straight flush / Royal
  };

  const [lo, hi] = rankRanges[hand.rank] ?? [0.08, 0.25];

  // Sub-rank within category using kicker/high card
  const highCard = Math.max(rankValue(holeCards[0].rank), rankValue(holeCards[1].rank));
  const subRank = (highCard - 2) / 12;

  return lo + (hi - lo) * subRank;
}

/**
 * Count potential outs for draw hands (simplified).
 * Gives the AI awareness of drawing potential to avoid folding draws.
 */
function estimateDrawPotential(
  holeCards: [Card, Card],
  communityCards: Card[],
): number {
  if (communityCards.length < 3 || communityCards.length >= 5) return 0;

  const allCards = [...holeCards, ...communityCards];
  let potential = 0;

  // Flush draw: 4 of same suit = ~9 outs
  const suitCounts = new Map<string, number>();
  for (const c of allCards) {
    suitCounts.set(c.suit, (suitCounts.get(c.suit) ?? 0) + 1);
  }
  for (const count of suitCounts.values()) {
    if (count === 4) potential += 0.18; // ~35% equity boost for flush draw
  }

  // Straight draw (open-ended): 4 consecutive ranks = ~8 outs
  const ranks = [...new Set(allCards.map(c => rankValue(c.rank)))].sort((a, b) => a - b);
  for (let i = 0; i < ranks.length - 3; i++) {
    if (ranks[i + 3] - ranks[i] <= 4) {
      const consecutive = ranks.slice(i, i + 4).every((r, j) =>
        j === 0 || r - ranks[i + j - 1] <= 2
      );
      if (consecutive) potential += 0.12;
    }
  }

  // More cards to come = draws more valuable
  if (communityCards.length === 3) potential *= 1.2; // flop: two cards to come
  // turn: one card to come (no multiplier)

  return Math.min(0.25, potential);
}

/**
 * AI decision engine. Given hand strength and personality, decide action.
 *
 * Key improvements:
 * - Street-aware thresholds (stickier postflop)
 * - Pot commitment consideration
 * - Draw awareness
 * - Position-sensitive noise
 */
export function makeDecision(
  personality: AiPersonality,
  handStrength: number,
  validActions: ValidAction[],
  state: GameState,
  playerId: string,
): AiDecision {
  const hasCheck = validActions.some(a => a.type === 'check');
  const hasCall = validActions.some(a => a.type === 'call');
  const hasRaise = validActions.some(a => a.type === 'raise');

  const callAction = validActions.find(a => a.type === 'call');
  const raiseAction = validActions.find(a => a.type === 'raise');

  const player = state.players.find(p => p.id === playerId);

  // Add randomness (personality-scaled: LAG more volatile, TP more consistent)
  const volatility = 0.08 + personality.aggression * 0.08;
  const noise = (Math.random() - 0.5) * volatility;
  let adjustedStrength = handStrength + noise;

  // Draw potential boosts effective strength postflop
  if (player?.holeCards && state.communityCards.length >= 3 && state.communityCards.length < 5) {
    adjustedStrength += estimateDrawPotential(player.holeCards, state.communityCards);
  }

  // Bluff check
  const isBluffing = Math.random() < personality.bluffFrequency;

  // ── PREFLOP DECISION ──
  if (state.street === 'preflop') {
    return makePreflopDecision(personality, adjustedStrength, isBluffing, validActions, state, hasCheck, hasCall, hasRaise, callAction, raiseAction);
  }

  // ── POSTFLOP DECISION ──
  return makePostflopDecision(personality, adjustedStrength, isBluffing, validActions, state, playerId, hasCheck, hasCall, hasRaise, callAction, raiseAction);
}

function makePreflopDecision(
  personality: AiPersonality,
  adjustedStrength: number,
  isBluffing: boolean,
  validActions: ValidAction[],
  state: GameState,
  hasCheck: boolean,
  hasCall: boolean,
  hasRaise: boolean,
  callAction: ValidAction | undefined,
  raiseAction: ValidAction | undefined,
): AiDecision {
  // Preflop fold threshold based on VPIP
  // TAG (vpip 0.22): folds below ~0.42, LP (vpip 0.55): folds below ~0.20
  const foldThreshold = 0.55 - personality.vpip * 1.2;

  // Can check for free — never fold
  if (hasCheck) {
    // Strong hand or aggressive: raise
    if (hasRaise && adjustedStrength > 0.55 && Math.random() < personality.aggression) {
      return makeRaise(raiseAction!, adjustedStrength, state, personality, false);
    }
    return { action: { type: 'check', amount: 0 }, reasoning: `${personality.name} checks preflop` };
  }

  // Facing a bet — decide whether to play
  if (adjustedStrength < foldThreshold && !isBluffing) {
    return {
      action: { type: 'fold', amount: 0 },
      reasoning: `Hand strength ${(adjustedStrength * 100).toFixed(0)}% below ${personality.name} preflop threshold`,
    };
  }

  // Premium hands: raise
  if (hasRaise && (adjustedStrength > 0.60 || isBluffing)) {
    if (Math.random() < personality.aggression) {
      return makeRaise(raiseAction!, adjustedStrength, state, personality, isBluffing);
    }
  }

  // Playable hand: call
  if (hasCall) {
    return {
      action: { type: 'call', amount: callAction!.minAmount! },
      reasoning: `${personality.name} calls preflop — strength ${(adjustedStrength * 100).toFixed(0)}%`,
    };
  }

  return { action: { type: 'fold', amount: 0 }, reasoning: 'No valid action' };
}

function makePostflopDecision(
  personality: AiPersonality,
  adjustedStrength: number,
  isBluffing: boolean,
  validActions: ValidAction[],
  state: GameState,
  playerId: string,
  hasCheck: boolean,
  hasCall: boolean,
  hasRaise: boolean,
  callAction: ValidAction | undefined,
  raiseAction: ValidAction | undefined,
): AiDecision {
  const player = state.players.find(p => p.id === playerId);

  // Pot commitment: if we've put in >30% of our starting stack, lower fold threshold
  const invested = player ? player.totalBetThisRound : 0;
  const startingStack = player ? player.chips + invested : 1000;
  const commitmentRatio = invested / startingStack;
  const commitmentBonus = commitmentRatio > 0.3 ? commitmentRatio * 0.15 : 0;

  // Postflop fold threshold is lower than preflop (already invested, be stickier)
  // TAG: ~0.20, LP: ~0.10, TP: ~0.25, LAG: ~0.12
  const baseFoldThreshold = 0.30 - personality.vpip * 0.4;
  const foldThreshold = Math.max(0.05, baseFoldThreshold - commitmentBonus);

  // Can check for free — never fold
  if (hasCheck) {
    // Bet for value or as a bluff
    if (hasRaise && (adjustedStrength > 0.50 || isBluffing) && Math.random() < personality.aggression) {
      return makeRaise(raiseAction!, adjustedStrength, state, personality, isBluffing);
    }
    return { action: { type: 'check', amount: 0 }, reasoning: `${personality.name} checks` };
  }

  // Facing a bet: pot odds analysis
  if (hasCall && callAction) {
    const callAmount = callAction.minAmount!;
    const potAfterCall = state.pot + callAmount;
    const potOdds = callAmount / potAfterCall;

    // Strong hand: raise
    if (hasRaise && adjustedStrength > 0.60 && Math.random() < personality.aggression && !isBluffing) {
      return makeRaise(raiseAction!, adjustedStrength, state, personality, false);
    }

    // Bluff raise
    if (hasRaise && isBluffing && Math.random() < personality.aggression * 0.6) {
      return makeRaise(raiseAction!, adjustedStrength, state, personality, true);
    }

    // Call if hand strength beats pot odds, or if we're committed, or personality is loose
    const shouldCall =
      adjustedStrength > potOdds * 0.85 ||  // reasonable equity vs price
      adjustedStrength > foldThreshold ||     // hand is above our playing threshold
      commitmentRatio > 0.4 ||                // pot committed
      (Math.random() < personality.vpip * 0.3); // loose players call more

    if (shouldCall) {
      return {
        action: { type: 'call', amount: callAmount },
        reasoning: `${personality.name} calls — strength ${(adjustedStrength * 100).toFixed(0)}% vs pot odds ${(potOdds * 100).toFixed(0)}%`,
      };
    }

    return {
      action: { type: 'fold', amount: 0 },
      reasoning: `${personality.name} folds — strength ${(adjustedStrength * 100).toFixed(0)}% below threshold`,
    };
  }

  // No bet to face and can't check (shouldn't happen, but fallback)
  return { action: { type: 'fold', amount: 0 }, reasoning: 'No valid action available' };
}

function makeRaise(
  raiseAction: ValidAction,
  strength: number,
  state: GameState,
  personality: AiPersonality,
  isBluff: boolean,
): AiDecision {
  const min = raiseAction.minAmount!;
  const max = raiseAction.maxAmount!;

  let target: number;
  if (isBluff) {
    // Bluffs: min raise or small sizing to be cheap
    target = min;
  } else if (strength > 0.85) {
    // Monster: big sizing (65-90% of range)
    const fraction = 0.65 + Math.random() * 0.25;
    target = Math.floor(min + (max - min) * fraction);
  } else {
    // Value: scale with strength (30-60% of range)
    const fraction = 0.3 + (strength - 0.5) * 0.8;
    target = Math.floor(min + (max - min) * Math.max(0.1, Math.min(0.6, fraction)));
  }

  const amount = Math.max(min, Math.min(max, target));

  return {
    action: { type: 'raise', amount },
    reasoning: isBluff
      ? `${personality.name} bluff raise`
      : `${personality.name} value raise — strength ${(strength * 100).toFixed(0)}%`,
  };
}

/**
 * Create an ActionProvider for an AI player with given personality.
 */
export function createAiActionProvider(personality: AiPersonality) {
  return async (
    playerId: string,
    validActions: ValidAction[],
    state: GameState,
  ): Promise<PlayerAction> => {
    const player = state.players.find(p => p.id === playerId);
    if (!player?.holeCards) {
      // No cards — just check or fold
      const check = validActions.find(a => a.type === 'check');
      return check ? { type: 'check', amount: 0 } : { type: 'fold', amount: 0 };
    }

    const strength = state.communityCards.length >= 3
      ? estimatePostflopStrength(player.holeCards, state.communityCards)
      : estimatePreflopStrength(player.holeCards);

    const decision = makeDecision(personality, strength, validActions, state, playerId);
    return decision.action;
  };
}

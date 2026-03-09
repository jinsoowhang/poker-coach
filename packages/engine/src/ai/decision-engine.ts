import { AiPersonality, AiDecision, PlayerAction, ValidAction, GameState, Card } from '../types.js';
import { evaluateHand } from '../hand-evaluator.js';
import { rankValue } from '../card.js';

/**
 * Estimate preflop hand strength as a 0-1 percentile.
 * Uses a simplified heuristic based on card ranks, suitedness, and pairness.
 */
export function estimatePreflopStrength(holeCards: [Card, Card]): number {
  const [a, b] = holeCards;
  const highRank = Math.max(rankValue(a.rank), rankValue(b.rank));
  const lowRank = Math.min(rankValue(a.rank), rankValue(b.rank));
  const isPair = a.rank === b.rank;
  const isSuited = a.suit === b.suit;
  const gap = highRank - lowRank;

  let strength = 0;

  // Base: higher cards are better
  strength += (highRank - 2) / 12 * 0.4;  // 0 to 0.4
  strength += (lowRank - 2) / 12 * 0.15;  // 0 to 0.15

  // Pairs are strong
  if (isPair) {
    strength += 0.25 + (highRank - 2) / 12 * 0.15; // 0.25 to 0.40
  }

  // Suited bonus
  if (isSuited) {
    strength += 0.06;
  }

  // Connectedness (smaller gap = better straight potential)
  if (gap <= 4 && !isPair) {
    strength += (5 - gap) / 5 * 0.08;
  }

  return Math.min(1, Math.max(0, strength));
}

/**
 * Estimate postflop hand strength using the evaluator.
 * Returns 0-1 based on hand rank.
 */
export function estimatePostflopStrength(
  holeCards: [Card, Card],
  communityCards: Card[],
): number {
  const hand = evaluateHand([...holeCards, ...communityCards]);
  // pokersolver rank 1-9, normalize to 0-1
  // Add sub-rank based on description for more granularity
  const baseStrength = (hand.rank - 1) / 8;

  // Boost based on high cards in the hand
  const highCard = Math.max(rankValue(holeCards[0].rank), rankValue(holeCards[1].rank));
  const kicker = (highCard - 2) / 12 * 0.05;

  return Math.min(1, baseStrength + kicker);
}

/**
 * AI decision engine. Given hand strength and personality, decide action.
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

  // Add randomness
  const noise = (Math.random() - 0.5) * 0.15;
  const adjustedStrength = handStrength + noise;

  // Should we even play this hand? (preflop fold threshold)
  const playThreshold = 1 - personality.vpip;

  // Bluff check
  const isBluffing = Math.random() < personality.bluffFrequency;

  // Decision logic
  if (adjustedStrength < playThreshold && !isBluffing && !hasCheck) {
    return {
      action: { type: 'fold', amount: 0 },
      reasoning: `Hand strength ${(handStrength * 100).toFixed(0)}% below ${personality.name} threshold`,
    };
  }

  // Strong hand or bluff — consider raising
  if (hasRaise && (adjustedStrength > 0.6 || isBluffing) && Math.random() < personality.aggression) {
    const raiseSize = calculateRaiseSize(raiseAction!, adjustedStrength, state, isBluffing);
    return {
      action: { type: 'raise', amount: raiseSize },
      reasoning: isBluffing
        ? `${personality.name} bluff raise`
        : `${personality.name} value raise — strength ${(handStrength * 100).toFixed(0)}%`,
    };
  }

  // Medium hand — call
  if (hasCall) {
    // Pot odds check: only call if hand strength justifies the price
    const potOdds = callAction!.minAmount! / (state.pot + callAction!.minAmount!);
    if (adjustedStrength > potOdds || Math.random() < personality.vpip) {
      return {
        action: { type: 'call', amount: callAction!.minAmount! },
        reasoning: `${personality.name} calls — strength ${(handStrength * 100).toFixed(0)}% vs pot odds ${(potOdds * 100).toFixed(0)}%`,
      };
    }
    return {
      action: { type: 'fold', amount: 0 },
      reasoning: `${personality.name} folds — pot odds unfavorable`,
    };
  }

  // No bet to face — check
  if (hasCheck) {
    return {
      action: { type: 'check', amount: 0 },
      reasoning: `${personality.name} checks`,
    };
  }

  // Fallback
  return {
    action: { type: 'fold', amount: 0 },
    reasoning: 'No valid action available',
  };
}

function calculateRaiseSize(
  raiseAction: ValidAction,
  strength: number,
  state: GameState,
  isBluff: boolean,
): number {
  const min = raiseAction.minAmount!;
  const max = raiseAction.maxAmount!;

  if (isBluff) {
    // Bluffs: smaller sizing (min raise or ~60% pot)
    return min;
  }

  // Value: scale raise size with hand strength
  // Strong hands: 2.5-3x, monster hands: bigger
  const sizeFraction = 0.3 + strength * 0.5; // 0.3 to 0.8 of range
  const target = Math.floor(min + (max - min) * sizeFraction);

  return Math.max(min, Math.min(max, target));
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

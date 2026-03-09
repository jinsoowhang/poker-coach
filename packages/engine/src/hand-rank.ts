import { Card, Player, HandWinner } from './types.js';
import { evaluateHand, findWinnerIndices, EvaluatedHand } from './hand-evaluator.js';

export interface PlayerHandResult {
  playerId: string;
  hand: EvaluatedHand;
}

/**
 * Evaluate each active (non-folded) player's best hand given community cards.
 */
export function evaluatePlayerHands(
  players: Player[],
  communityCards: Card[],
): PlayerHandResult[] {
  return players
    .filter(p => !p.folded && p.holeCards !== null)
    .map(p => ({
      playerId: p.id,
      hand: evaluateHand([...p.holeCards!, ...communityCards]),
    }));
}

/**
 * Determine winner(s) from active players given community cards.
 * Returns HandWinner[] (may have multiple for split pots).
 */
export function determineWinners(
  players: Player[],
  communityCards: Card[],
  potAmount: number,
): HandWinner[] {
  const results = evaluatePlayerHands(players, communityCards);

  if (results.length === 0) {
    return [];
  }

  if (results.length === 1) {
    return [{
      playerId: results[0].playerId,
      amount: potAmount,
      handName: results[0].hand.description,
      cards: results[0].hand.cards,
    }];
  }

  const winnerIndices = findWinnerIndices(results.map(r => r.hand));
  const splitAmount = Math.floor(potAmount / winnerIndices.length);
  const remainder = potAmount - splitAmount * winnerIndices.length;

  return winnerIndices.map((idx, i) => ({
    playerId: results[idx].playerId,
    amount: splitAmount + (i === 0 ? remainder : 0),
    handName: results[idx].hand.description,
    cards: results[idx].hand.cards,
  }));
}

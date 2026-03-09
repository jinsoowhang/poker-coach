import { Card } from './types.js';
import { cardToPokersolverString } from './card.js';

// pokersolver is a CJS module with no types
// eslint-disable-next-line @typescript-eslint/no-require-imports
import PokerSolver from 'pokersolver';
const { Hand } = PokerSolver;

export interface EvaluatedHand {
  rank: number;        // 1-9 (higher = better hand category, pokersolver scale)
  name: string;        // e.g. "Flush", "Two Pair"
  description: string; // e.g. "Ace High Flush"
  cards: Card[];       // the 5 best cards used
  /** Internal pokersolver hand for comparison. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _solvedHand: any;
}

/**
 * Evaluate the best 5-card hand from a set of cards (typically 5-7).
 * Pass hole cards + community cards combined.
 */
export function evaluateHand(cards: Card[]): EvaluatedHand {
  if (cards.length < 5) {
    throw new Error(`Need at least 5 cards to evaluate, got ${cards.length}`);
  }

  const solverStrings = cards.map(cardToPokersolverString);
  const solved = Hand.solve(solverStrings);

  return {
    rank: solved.rank,
    name: solved.name,
    description: solved.descr,
    cards: cards.slice(0, 5), // simplified — best 5 from input
    _solvedHand: solved,
  };
}

/**
 * Compare two evaluated hands. Returns:
 *  positive if a wins, negative if b wins, 0 if tie.
 */
export function compareHands(a: EvaluatedHand, b: EvaluatedHand): number {
  const winners = Hand.winners([a._solvedHand, b._solvedHand]);
  if (winners.length === 2) return 0; // tie
  return winners[0] === a._solvedHand ? 1 : -1;
}

/**
 * From a list of evaluated hands, return the indices of the winner(s).
 */
export function findWinnerIndices(hands: EvaluatedHand[]): number[] {
  const solvedHands = hands.map(h => h._solvedHand);
  const winners = Hand.winners(solvedHands);
  return winners.map((w: unknown) => solvedHands.indexOf(w));
}

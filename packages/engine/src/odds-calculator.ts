import { Card, Rank, Suit, SUITS, RANKS } from './types.js';
import { rankValue } from './card.js';

// ── Pot Odds ──

export interface PotOdds {
  ratio: string;      // e.g. "5:1"
  percentage: number;  // e.g. 16.7
  callAmount: number;
  potSize: number;
}

export function calculatePotOdds(potSize: number, callAmount: number): PotOdds {
  if (callAmount <= 0) {
    return { ratio: '0:0', percentage: 0, callAmount: 0, potSize };
  }

  const totalPot = potSize + callAmount;
  const percentage = (callAmount / totalPot) * 100;
  const ratioValue = Math.round(potSize / callAmount);

  return {
    ratio: `${ratioValue}:1`,
    percentage: Math.round(percentage * 10) / 10,
    callAmount,
    potSize,
  };
}

// ── Outs ──

export interface OutInfo {
  drawType: string;
  outs: number;
  cards: Card[];
  probability: number; // percentage to hit by next card
}

/**
 * Count outs for the human player given their hole cards and community cards.
 * Returns categorized outs by draw type.
 */
export function countOuts(
  holeCards: [Card, Card],
  communityCards: Card[],
): OutInfo[] {
  if (communityCards.length < 3) return []; // no outs preflop

  const allKnown = [...holeCards, ...communityCards];
  const remaining = getRemainingDeck(allKnown);
  const draws: OutInfo[] = [];

  const flushOuts = findFlushOuts(holeCards, communityCards, remaining);
  if (flushOuts.length > 0) {
    draws.push({
      drawType: 'Flush draw',
      outs: flushOuts.length,
      cards: flushOuts,
      probability: calcProbability(flushOuts.length, remaining.length),
    });
  }

  const straightOuts = findStraightOuts(holeCards, communityCards, remaining);
  // Filter out cards already counted as flush outs
  const uniqueStraightOuts = straightOuts.filter(
    c => !flushOuts.some(f => f.rank === c.rank && f.suit === c.suit),
  );
  if (straightOuts.length > 0) {
    const label = straightOuts.length >= 8 ? 'Open-ended straight draw' : 'Gutshot straight draw';
    draws.push({
      drawType: label,
      outs: straightOuts.length,
      cards: straightOuts,
      probability: calcProbability(straightOuts.length, remaining.length),
    });
  }

  const pairOuts = findOvercardOuts(holeCards, communityCards, remaining);
  if (pairOuts.length > 0) {
    draws.push({
      drawType: 'Overcard pair',
      outs: pairOuts.length,
      cards: pairOuts,
      probability: calcProbability(pairOuts.length, remaining.length),
    });
  }

  const setOuts = findSetOuts(holeCards, communityCards, remaining);
  if (setOuts.length > 0) {
    draws.push({
      drawType: 'Set (trips)',
      outs: setOuts.length,
      cards: setOuts,
      probability: calcProbability(setOuts.length, remaining.length),
    });
  }

  return draws;
}

/**
 * Total unique outs across all draw types.
 */
export function totalUniqueOuts(outInfos: OutInfo[]): number {
  const seen = new Set<string>();
  for (const info of outInfos) {
    for (const card of info.cards) {
      seen.add(`${card.rank}${card.suit}`);
    }
  }
  return seen.size;
}

// ── Internal helpers ──

function getRemainingDeck(knownCards: Card[]): Card[] {
  const known = new Set(knownCards.map(c => `${c.rank}${c.suit}`));
  const remaining: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      if (!known.has(`${rank}${suit}`)) {
        remaining.push({ rank, suit });
      }
    }
  }
  return remaining;
}

function calcProbability(outs: number, remaining: number): number {
  if (remaining <= 0) return 0;
  return Math.round((outs / remaining) * 1000) / 10;
}

function findFlushOuts(
  holeCards: [Card, Card],
  communityCards: Card[],
  remaining: Card[],
): Card[] {
  const allCards = [...holeCards, ...communityCards];

  // Count suits
  const suitCounts: Record<string, number> = {};
  for (const c of allCards) {
    suitCounts[c.suit] = (suitCounts[c.suit] ?? 0) + 1;
  }

  // Need exactly 4 of a suit to have a flush draw
  for (const [suit, count] of Object.entries(suitCounts)) {
    if (count === 4) {
      return remaining.filter(c => c.suit === suit);
    }
  }

  return [];
}

function findStraightOuts(
  holeCards: [Card, Card],
  communityCards: Card[],
  remaining: Card[],
): Card[] {
  const allCards = [...holeCards, ...communityCards];
  const values = new Set(allCards.map(c => rankValue(c.rank)));
  const outs: Card[] = [];

  // Check each possible 5-card straight
  // Values: 2=2, 3=3, ..., A=14. Also A=1 for wheel
  const allValues = [...values];
  if (values.has(14)) allValues.push(1); // Ace can be low

  for (let low = 1; low <= 10; low++) {
    const straightValues = [low, low + 1, low + 2, low + 3, low + 4];
    const have = straightValues.filter(v => allValues.includes(v));
    const need = straightValues.filter(v => !allValues.includes(v));

    // If we have 4 of the 5, we have a draw
    if (have.length === 4 && need.length === 1) {
      const neededValue = need[0];
      const neededRank = valueToRank(neededValue);
      if (neededRank) {
        const matchingCards = remaining.filter(c => rankValue(c.rank) === neededValue);
        for (const c of matchingCards) {
          if (!outs.some(o => o.rank === c.rank && o.suit === c.suit)) {
            outs.push(c);
          }
        }
      }
    }
  }

  return outs;
}

function findOvercardOuts(
  holeCards: [Card, Card],
  communityCards: Card[],
  remaining: Card[],
): Card[] {
  const boardHighest = Math.max(...communityCards.map(c => rankValue(c.rank)));
  const overcards = holeCards.filter(c => rankValue(c.rank) > boardHighest);

  if (overcards.length === 0) return [];

  // Each overcard has 3 outs to pair
  return remaining.filter(c =>
    overcards.some(oc => oc.rank === c.rank),
  );
}

function findSetOuts(
  holeCards: [Card, Card],
  communityCards: Card[],
  remaining: Card[],
): Card[] {
  const allCards = [...holeCards, ...communityCards];

  // Check if we have exactly a pair in hole cards or hole+board
  for (const hc of holeCards) {
    const pairCount = allCards.filter(c => c.rank === hc.rank).length;
    if (pairCount === 2) {
      // We have a pair — outs to make trips
      return remaining.filter(c => c.rank === hc.rank);
    }
  }

  return [];
}

function valueToRank(value: number): Rank | null {
  if (value === 1 || value === 14) return 'A';
  const idx = value - 2;
  return RANKS[idx] ?? null;
}

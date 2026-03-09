import { Card, Rank, Suit, RANKS, SUITS } from './types.js';

const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export function createCard(rank: Rank, suit: Suit): Card {
  return { rank, suit };
}

export function cardToString(card: Card): string {
  return `${card.rank}${SUIT_SYMBOLS[card.suit]}`;
}

export function rankValue(rank: Rank): number {
  return RANK_VALUES[rank];
}

export function compareCards(a: Card, b: Card): number {
  return rankValue(a.rank) - rankValue(b.rank);
}

export function cardsEqual(a: Card, b: Card): boolean {
  return a.rank === b.rank && a.suit === b.suit;
}

/** Build a standard 52-card deck. */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push(createCard(rank, suit));
    }
  }
  return deck;
}

/** Convert a card to the string format pokersolver expects, e.g. "Ah", "Td". */
export function cardToPokersolverString(card: Card): string {
  const rankMap: Record<Rank, string> = {
    '2': '2', '3': '3', '4': '4', '5': '5', '6': '6', '7': '7', '8': '8',
    '9': '9', '10': 'T', 'J': 'J', 'Q': 'Q', 'K': 'K', 'A': 'A',
  };
  const suitMap: Record<Suit, string> = {
    hearts: 'h', diamonds: 'd', clubs: 'c', spades: 's',
  };
  return `${rankMap[card.rank]}${suitMap[card.suit]}`;
}

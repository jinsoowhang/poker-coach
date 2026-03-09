import { describe, it, expect } from 'vitest';
import { createCard, cardToString, compareCards, cardsEqual, createDeck, cardToPokersolverString } from './card.js';

describe('createCard', () => {
  it('creates a card with rank and suit', () => {
    const card = createCard('A', 'spades');
    expect(card).toEqual({ rank: 'A', suit: 'spades' });
  });
});

describe('cardToString', () => {
  it('formats card with unicode suit symbol', () => {
    expect(cardToString(createCard('A', 'spades'))).toBe('A♠');
    expect(cardToString(createCard('10', 'hearts'))).toBe('10♥');
    expect(cardToString(createCard('K', 'diamonds'))).toBe('K♦');
    expect(cardToString(createCard('2', 'clubs'))).toBe('2♣');
  });
});

describe('compareCards', () => {
  it('returns positive when first card is higher', () => {
    expect(compareCards(createCard('A', 'spades'), createCard('K', 'spades'))).toBeGreaterThan(0);
  });

  it('returns negative when first card is lower', () => {
    expect(compareCards(createCard('2', 'hearts'), createCard('3', 'hearts'))).toBeLessThan(0);
  });

  it('returns 0 for same rank', () => {
    expect(compareCards(createCard('J', 'hearts'), createCard('J', 'spades'))).toBe(0);
  });
});

describe('cardsEqual', () => {
  it('returns true for identical cards', () => {
    expect(cardsEqual(createCard('A', 'spades'), createCard('A', 'spades'))).toBe(true);
  });

  it('returns false for different rank or suit', () => {
    expect(cardsEqual(createCard('A', 'spades'), createCard('A', 'hearts'))).toBe(false);
    expect(cardsEqual(createCard('A', 'spades'), createCard('K', 'spades'))).toBe(false);
  });
});

describe('createDeck', () => {
  it('creates a 52-card deck', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
  });

  it('has no duplicate cards', () => {
    const deck = createDeck();
    const seen = new Set(deck.map(c => `${c.rank}${c.suit}`));
    expect(seen.size).toBe(52);
  });
});

describe('cardToPokersolverString', () => {
  it('converts cards to pokersolver format', () => {
    expect(cardToPokersolverString(createCard('A', 'hearts'))).toBe('Ah');
    expect(cardToPokersolverString(createCard('10', 'spades'))).toBe('Ts');
    expect(cardToPokersolverString(createCard('2', 'clubs'))).toBe('2c');
    expect(cardToPokersolverString(createCard('K', 'diamonds'))).toBe('Kd');
  });
});

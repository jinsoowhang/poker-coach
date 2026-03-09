import { describe, it, expect } from 'vitest';
import { Deck } from './deck.js';

describe('Deck', () => {
  it('starts with 52 cards', () => {
    const deck = new Deck();
    expect(deck.remaining).toBe(52);
  });

  it('draws the requested number of cards', () => {
    const deck = new Deck();
    const cards = deck.draw(5);
    expect(cards).toHaveLength(5);
    expect(deck.remaining).toBe(47);
  });

  it('throws when drawing more cards than remaining', () => {
    const deck = new Deck();
    deck.draw(50);
    expect(() => deck.draw(5)).toThrow('Cannot draw 5 cards, only 2 remaining');
  });

  it('shuffles without losing cards', () => {
    const deck = new Deck();
    deck.shuffle();
    expect(deck.remaining).toBe(52);
    const all = deck.draw(52);
    const unique = new Set(all.map(c => `${c.rank}${c.suit}`));
    expect(unique.size).toBe(52);
  });

  it('shuffle changes card order (probabilistic)', () => {
    const deck1 = new Deck();
    const deck2 = new Deck();
    deck2.shuffle();
    const cards1 = deck1.draw(52).map(c => `${c.rank}${c.suit}`);
    const cards2 = deck2.draw(52).map(c => `${c.rank}${c.suit}`);
    // Extremely unlikely to be the same after shuffle
    expect(cards1).not.toEqual(cards2);
  });

  it('reset restores 52 cards', () => {
    const deck = new Deck();
    deck.draw(10);
    deck.reset();
    expect(deck.remaining).toBe(52);
  });

  it('peek returns copy without removing cards', () => {
    const deck = new Deck();
    const peeked = deck.peek();
    expect(peeked).toHaveLength(52);
    expect(deck.remaining).toBe(52);
  });
});

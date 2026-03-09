import { describe, it, expect } from 'vitest';
import { evaluateHand, compareHands, findWinnerIndices } from './hand-evaluator.js';
import { createCard } from './card.js';
import type { Card } from './types.js';

function cards(...defs: [string, string][]): Card[] {
  return defs.map(([r, s]) => createCard(r as any, s as any));
}

describe('evaluateHand', () => {
  it('throws with fewer than 5 cards', () => {
    expect(() => evaluateHand(cards(['A', 'spades'], ['K', 'hearts']))).toThrow();
  });

  it('detects a royal flush', () => {
    const hand = evaluateHand(cards(
      ['A', 'hearts'], ['K', 'hearts'], ['Q', 'hearts'], ['J', 'hearts'], ['10', 'hearts'],
    ));
    expect(hand.name).toBe('Straight Flush');
    expect(hand.description).toContain('Royal');
    expect(hand.rank).toBe(9);
  });

  it('detects four of a kind', () => {
    const hand = evaluateHand(cards(
      ['A', 'hearts'], ['A', 'diamonds'], ['A', 'clubs'], ['A', 'spades'], ['K', 'hearts'],
    ));
    expect(hand.name).toBe('Four of a Kind');
    expect(hand.rank).toBe(8);
  });

  it('detects a full house', () => {
    const hand = evaluateHand(cards(
      ['K', 'hearts'], ['K', 'diamonds'], ['K', 'clubs'], ['Q', 'spades'], ['Q', 'hearts'],
    ));
    expect(hand.name).toBe('Full House');
    expect(hand.rank).toBe(7);
  });

  it('detects a flush', () => {
    const hand = evaluateHand(cards(
      ['A', 'hearts'], ['10', 'hearts'], ['7', 'hearts'], ['5', 'hearts'], ['2', 'hearts'],
    ));
    expect(hand.name).toBe('Flush');
    expect(hand.rank).toBe(6);
  });

  it('detects a straight', () => {
    const hand = evaluateHand(cards(
      ['9', 'hearts'], ['8', 'diamonds'], ['7', 'clubs'], ['6', 'spades'], ['5', 'hearts'],
    ));
    expect(hand.name).toBe('Straight');
    expect(hand.rank).toBe(5);
  });

  it('detects three of a kind', () => {
    const hand = evaluateHand(cards(
      ['J', 'hearts'], ['J', 'diamonds'], ['J', 'clubs'], ['4', 'spades'], ['2', 'hearts'],
    ));
    expect(hand.name).toBe('Three of a Kind');
    expect(hand.rank).toBe(4);
  });

  it('detects two pair', () => {
    const hand = evaluateHand(cards(
      ['J', 'hearts'], ['J', 'diamonds'], ['4', 'clubs'], ['4', 'spades'], ['2', 'hearts'],
    ));
    expect(hand.name).toBe('Two Pair');
    expect(hand.rank).toBe(3);
  });

  it('detects one pair', () => {
    const hand = evaluateHand(cards(
      ['J', 'hearts'], ['J', 'diamonds'], ['9', 'clubs'], ['4', 'spades'], ['2', 'hearts'],
    ));
    expect(hand.name).toBe('Pair');
    expect(hand.rank).toBe(2);
  });

  it('detects high card', () => {
    const hand = evaluateHand(cards(
      ['A', 'hearts'], ['10', 'diamonds'], ['7', 'clubs'], ['4', 'spades'], ['2', 'hearts'],
    ));
    expect(hand.name).toBe('High Card');
    expect(hand.rank).toBe(1);
  });

  it('evaluates 7-card hand (picks best 5)', () => {
    const hand = evaluateHand(cards(
      ['A', 'hearts'], ['K', 'hearts'], ['Q', 'hearts'], ['J', 'hearts'], ['10', 'hearts'],
      ['2', 'clubs'], ['3', 'diamonds'],
    ));
    expect(hand.name).toBe('Straight Flush');
  });
});

describe('compareHands', () => {
  it('flush beats straight', () => {
    const flush = evaluateHand(cards(
      ['A', 'hearts'], ['10', 'hearts'], ['7', 'hearts'], ['5', 'hearts'], ['2', 'hearts'],
    ));
    const straight = evaluateHand(cards(
      ['9', 'hearts'], ['8', 'diamonds'], ['7', 'clubs'], ['6', 'spades'], ['5', 'clubs'],
    ));
    expect(compareHands(flush, straight)).toBeGreaterThan(0);
    expect(compareHands(straight, flush)).toBeLessThan(0);
  });

  it('returns 0 for equivalent hands', () => {
    const a = evaluateHand(cards(
      ['A', 'hearts'], ['K', 'diamonds'], ['Q', 'clubs'], ['J', 'spades'], ['9', 'hearts'],
    ));
    const b = evaluateHand(cards(
      ['A', 'clubs'], ['K', 'spades'], ['Q', 'hearts'], ['J', 'diamonds'], ['9', 'clubs'],
    ));
    expect(compareHands(a, b)).toBe(0);
  });
});

describe('findWinnerIndices', () => {
  it('finds single winner', () => {
    const hands = [
      evaluateHand(cards(['A', 'hearts'], ['K', 'hearts'], ['Q', 'hearts'], ['J', 'hearts'], ['10', 'hearts'])),
      evaluateHand(cards(['2', 'hearts'], ['3', 'diamonds'], ['5', 'clubs'], ['7', 'spades'], ['9', 'hearts'])),
    ];
    expect(findWinnerIndices(hands)).toEqual([0]);
  });

  it('finds multiple winners (tie)', () => {
    const hands = [
      evaluateHand(cards(['A', 'hearts'], ['K', 'diamonds'], ['Q', 'clubs'], ['J', 'spades'], ['9', 'hearts'])),
      evaluateHand(cards(['A', 'clubs'], ['K', 'spades'], ['Q', 'hearts'], ['J', 'diamonds'], ['9', 'clubs'])),
    ];
    expect(findWinnerIndices(hands)).toEqual([0, 1]);
  });

  it('winner from three players', () => {
    const hands = [
      evaluateHand(cards(['2', 'hearts'], ['3', 'diamonds'], ['5', 'clubs'], ['7', 'spades'], ['9', 'hearts'])),
      evaluateHand(cards(['A', 'hearts'], ['A', 'diamonds'], ['K', 'clubs'], ['K', 'spades'], ['Q', 'hearts'])),
      evaluateHand(cards(['J', 'hearts'], ['J', 'diamonds'], ['4', 'clubs'], ['4', 'spades'], ['2', 'clubs'])),
    ];
    expect(findWinnerIndices(hands)).toEqual([1]);
  });
});

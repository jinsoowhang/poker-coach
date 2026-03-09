import { describe, it, expect } from 'vitest';
import { calculatePotOdds, countOuts, totalUniqueOuts } from './odds-calculator.js';
import { createCard } from './card.js';
import type { Card } from './types.js';

const c = createCard;

describe('calculatePotOdds', () => {
  it('calculates correct pot odds', () => {
    const odds = calculatePotOdds(100, 20);
    expect(odds.ratio).toBe('5:1');
    expect(odds.percentage).toBeCloseTo(16.7, 0);
  });

  it('handles zero call amount', () => {
    const odds = calculatePotOdds(100, 0);
    expect(odds.percentage).toBe(0);
  });

  it('handles equal pot and call', () => {
    const odds = calculatePotOdds(50, 50);
    expect(odds.ratio).toBe('1:1');
    expect(odds.percentage).toBe(50);
  });
});

describe('countOuts', () => {
  it('returns empty for preflop (no community cards)', () => {
    const outs = countOuts(
      [c('A', 'hearts'), c('K', 'hearts')],
      [],
    );
    expect(outs).toEqual([]);
  });

  it('detects flush draw (4 to a flush)', () => {
    const holeCards: [Card, Card] = [c('A', 'hearts'), c('K', 'hearts')];
    const community: Card[] = [c('7', 'hearts'), c('3', 'hearts'), c('9', 'spades')];

    const outs = countOuts(holeCards, community);
    const flushDraw = outs.find(o => o.drawType === 'Flush draw');

    expect(flushDraw).toBeDefined();
    expect(flushDraw!.outs).toBe(9); // 13 hearts - 4 known = 9
    expect(flushDraw!.probability).toBeGreaterThan(0);
  });

  it('detects open-ended straight draw', () => {
    const holeCards: [Card, Card] = [c('8', 'hearts'), c('9', 'spades')];
    const community: Card[] = [c('10', 'clubs'), c('J', 'diamonds'), c('2', 'hearts')];

    const outs = countOuts(holeCards, community);
    const straightDraw = outs.find(o => o.drawType.includes('straight'));

    expect(straightDraw).toBeDefined();
    // 7 or Q completes the straight = 8 outs
    expect(straightDraw!.outs).toBe(8);
  });

  it('detects gutshot straight draw', () => {
    const holeCards: [Card, Card] = [c('8', 'hearts'), c('9', 'spades')];
    const community: Card[] = [c('10', 'clubs'), c('Q', 'diamonds'), c('2', 'hearts')];

    const outs = countOuts(holeCards, community);
    const straightDraw = outs.find(o => o.drawType.includes('straight'));

    expect(straightDraw).toBeDefined();
    // Only J completes = 4 outs
    expect(straightDraw!.outs).toBe(4);
  });

  it('detects overcard outs', () => {
    const holeCards: [Card, Card] = [c('A', 'spades'), c('K', 'diamonds')];
    const community: Card[] = [c('7', 'hearts'), c('3', 'clubs'), c('9', 'spades')];

    const outs = countOuts(holeCards, community);
    const overcards = outs.find(o => o.drawType === 'Overcard pair');

    expect(overcards).toBeDefined();
    // 3 aces + 3 kings = 6 outs
    expect(overcards!.outs).toBe(6);
  });

  it('detects set outs when holding a pocket pair', () => {
    const holeCards: [Card, Card] = [c('J', 'hearts'), c('J', 'diamonds')];
    const community: Card[] = [c('A', 'spades'), c('K', 'clubs'), c('3', 'hearts')];

    const outs = countOuts(holeCards, community);
    const setDraw = outs.find(o => o.drawType === 'Set (trips)');

    expect(setDraw).toBeDefined();
    expect(setDraw!.outs).toBe(2); // 2 remaining jacks
  });
});

describe('totalUniqueOuts', () => {
  it('deduplicates outs across draws', () => {
    // A card could complete both a flush and straight
    const holeCards: [Card, Card] = [c('J', 'hearts'), c('10', 'hearts')];
    const community: Card[] = [c('9', 'hearts'), c('8', 'hearts'), c('2', 'clubs')];

    const outs = countOuts(holeCards, community);
    const total = totalUniqueOuts(outs);

    // Should deduplicate: 7h and Qh complete both flush AND straight
    expect(total).toBeGreaterThan(0);
    // Total unique should be <= sum of individual outs
    const sum = outs.reduce((s, o) => s + o.outs, 0);
    expect(total).toBeLessThanOrEqual(sum);
  });
});

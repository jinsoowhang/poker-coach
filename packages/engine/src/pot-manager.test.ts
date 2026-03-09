import { describe, it, expect } from 'vitest';
import { calculateSidePots, collectBets } from './pot-manager.js';
import type { Player } from './types.js';

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id, name: id, chips: 1000, holeCards: null,
    currentBet: 0, totalBetThisRound: 0,
    folded: false, allIn: false, seatIndex: 0, isHuman: false,
    ...overrides,
  };
}

describe('calculateSidePots', () => {
  it('returns empty when no bets', () => {
    const players = [makePlayer('p1'), makePlayer('p2')];
    expect(calculateSidePots(players)).toEqual([]);
  });

  it('single pot when all bets are equal', () => {
    const players = [
      makePlayer('p1', { totalBetThisRound: 100 }),
      makePlayer('p2', { totalBetThisRound: 100 }),
      makePlayer('p3', { totalBetThisRound: 100 }),
    ];
    const pots = calculateSidePots(players);
    expect(pots).toHaveLength(1);
    expect(pots[0].amount).toBe(300);
    expect(pots[0].eligiblePlayerIds).toHaveLength(3);
  });

  it('creates side pot when player is all-in for less', () => {
    const players = [
      makePlayer('p1', { totalBetThisRound: 50, allIn: true }),
      makePlayer('p2', { totalBetThisRound: 100 }),
      makePlayer('p3', { totalBetThisRound: 100 }),
    ];
    const pots = calculateSidePots(players);
    expect(pots).toHaveLength(2);
    // Main pot: 50 * 3 = 150, all three eligible
    expect(pots[0].amount).toBe(150);
    expect(pots[0].eligiblePlayerIds).toHaveLength(3);
    // Side pot: 50 * 2 = 100, only p2 and p3
    expect(pots[1].amount).toBe(100);
    expect(pots[1].eligiblePlayerIds).toHaveLength(2);
  });

  it('excludes folded players from eligibility', () => {
    const players = [
      makePlayer('p1', { totalBetThisRound: 50, folded: true }),
      makePlayer('p2', { totalBetThisRound: 100 }),
      makePlayer('p3', { totalBetThisRound: 100 }),
    ];
    const pots = calculateSidePots(players);
    // p1 contributed but folded — their chips go into pots but they can't win
    expect(pots[0].eligiblePlayerIds).not.toContain('p1');
  });

  it('handles multiple all-in levels', () => {
    const players = [
      makePlayer('p1', { totalBetThisRound: 25, allIn: true }),
      makePlayer('p2', { totalBetThisRound: 75, allIn: true }),
      makePlayer('p3', { totalBetThisRound: 150 }),
    ];
    const pots = calculateSidePots(players);
    expect(pots).toHaveLength(3);
    // Layer 1: 25 * 3 = 75
    expect(pots[0].amount).toBe(75);
    expect(pots[0].eligiblePlayerIds).toHaveLength(3);
    // Layer 2: 50 * 2 = 100
    expect(pots[1].amount).toBe(100);
    expect(pots[1].eligiblePlayerIds).toHaveLength(2);
    // Layer 3: 75 * 1 = 75
    expect(pots[2].amount).toBe(75);
    expect(pots[2].eligiblePlayerIds).toHaveLength(1);
  });
});

describe('collectBets', () => {
  it('sums current bets and resets them', () => {
    const players = [
      makePlayer('p1', { currentBet: 50 }),
      makePlayer('p2', { currentBet: 100 }),
    ];
    const total = collectBets(players);
    expect(total).toBe(150);
    expect(players[0].currentBet).toBe(0);
    expect(players[1].currentBet).toBe(0);
  });
});

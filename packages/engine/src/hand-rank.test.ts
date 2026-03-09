import { describe, it, expect } from 'vitest';
import { evaluatePlayerHands, determineWinners } from './hand-rank.js';
import { createCard } from './card.js';
import type { Player, Card } from './types.js';

function makePlayer(id: string, holeCards: [Card, Card], opts?: Partial<Player>): Player {
  return {
    id,
    name: id,
    chips: 1000,
    holeCards,
    currentBet: 0,
    totalBetThisRound: 0,
    folded: false,
    allIn: false,
    seatIndex: 0,
    isHuman: false,
    ...opts,
  };
}

const c = createCard;

describe('evaluatePlayerHands', () => {
  it('evaluates hands for non-folded players', () => {
    const community: Card[] = [
      c('A', 'clubs'), c('K', 'clubs'), c('Q', 'clubs'), c('J', 'clubs'), c('10', 'clubs'),
    ];
    const players = [
      makePlayer('p1', [c('2', 'hearts'), c('3', 'hearts')]),
      makePlayer('p2', [c('9', 'spades'), c('8', 'spades')]),
      makePlayer('p3', [c('7', 'diamonds'), c('6', 'diamonds')], { folded: true }),
    ];

    const results = evaluatePlayerHands(players, community);
    expect(results).toHaveLength(2); // p3 folded
    expect(results[0].playerId).toBe('p1');
    expect(results[1].playerId).toBe('p2');
  });

  it('skips players with no hole cards', () => {
    const community: Card[] = [
      c('A', 'clubs'), c('K', 'clubs'), c('Q', 'clubs'), c('J', 'clubs'), c('10', 'clubs'),
    ];
    const players = [
      makePlayer('p1', [c('2', 'hearts'), c('3', 'hearts')]),
      { ...makePlayer('p2', [c('9', 'spades'), c('8', 'spades')]), holeCards: null } as Player,
    ];

    const results = evaluatePlayerHands(players, community);
    expect(results).toHaveLength(1);
  });
});

describe('determineWinners', () => {
  const community: Card[] = [
    c('2', 'clubs'), c('5', 'diamonds'), c('9', 'hearts'), c('J', 'spades'), c('K', 'clubs'),
  ];

  it('finds a single winner', () => {
    const players = [
      makePlayer('p1', [c('A', 'hearts'), c('A', 'diamonds')]), // pair of aces
      makePlayer('p2', [c('3', 'hearts'), c('4', 'diamonds')]), // high card
    ];

    const winners = determineWinners(players, community, 200);
    expect(winners).toHaveLength(1);
    expect(winners[0].playerId).toBe('p1');
    expect(winners[0].amount).toBe(200);
  });

  it('splits pot on tie', () => {
    // Both players have the same community-driven hand (community is best)
    const strongCommunity: Card[] = [
      c('A', 'clubs'), c('A', 'diamonds'), c('K', 'clubs'), c('K', 'diamonds'), c('Q', 'hearts'),
    ];
    const players = [
      makePlayer('p1', [c('2', 'hearts'), c('3', 'hearts')]),
      makePlayer('p2', [c('4', 'spades'), c('6', 'spades')]),
    ];

    const winners = determineWinners(players, strongCommunity, 300);
    expect(winners).toHaveLength(2);
    expect(winners[0].amount + winners[1].amount).toBe(300);
  });

  it('ignores folded players', () => {
    const players = [
      makePlayer('p1', [c('A', 'hearts'), c('A', 'diamonds')], { folded: true }),
      makePlayer('p2', [c('3', 'hearts'), c('4', 'diamonds')]),
    ];

    const winners = determineWinners(players, community, 100);
    expect(winners).toHaveLength(1);
    expect(winners[0].playerId).toBe('p2');
    expect(winners[0].amount).toBe(100);
  });

  it('returns empty array when no active players', () => {
    const players = [
      makePlayer('p1', [c('A', 'hearts'), c('A', 'diamonds')], { folded: true }),
    ];
    const winners = determineWinners(players, community, 100);
    expect(winners).toHaveLength(0);
  });

  it('handles odd chip splitting (extra chip to first winner)', () => {
    const strongCommunity: Card[] = [
      c('A', 'clubs'), c('A', 'diamonds'), c('K', 'clubs'), c('K', 'diamonds'), c('Q', 'hearts'),
    ];
    const players = [
      makePlayer('p1', [c('2', 'hearts'), c('3', 'hearts')]),
      makePlayer('p2', [c('4', 'spades'), c('6', 'spades')]),
    ];

    const winners = determineWinners(players, strongCommunity, 301);
    expect(winners[0].amount).toBe(151); // extra chip
    expect(winners[1].amount).toBe(150);
  });
});

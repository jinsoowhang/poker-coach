import { describe, it, expect } from 'vitest';
import { createInitialState, applyAction } from './game-state.js';
import { createCard } from './card.js';
import type { Player } from './types.js';

function makePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    chips: 1000,
    holeCards: null,
    currentBet: 0,
    totalBetThisRound: 0,
    folded: false,
    allIn: false,
    seatIndex: i,
    isHuman: i === 0,
  }));
}

describe('createInitialState', () => {
  it('creates clean state with reset players', () => {
    const state = createInitialState(makePlayers(3), 0, 5, 10, 1);
    expect(state.handNumber).toBe(1);
    expect(state.players).toHaveLength(3);
    expect(state.street).toBe('preflop');
    expect(state.pot).toBe(0);
    expect(state.communityCards).toHaveLength(0);
    expect(state.players.every(p => !p.folded && !p.allIn && p.currentBet === 0)).toBe(true);
  });
});

describe('applyAction', () => {
  it('POST_BLINDS deducts chips from SB and BB', () => {
    const state = createInitialState(makePlayers(3), 0, 5, 10, 1);
    const next = applyAction(state, { type: 'POST_BLINDS', smallBlind: 5, bigBlind: 10 });

    // Dealer=0, SB=1, BB=2
    expect(next.players[1].currentBet).toBe(5);
    expect(next.players[1].chips).toBe(995);
    expect(next.players[2].currentBet).toBe(10);
    expect(next.players[2].chips).toBe(990);
    // Original state unchanged
    expect(state.players[1].chips).toBe(1000);
  });

  it('DEAL_HOLE_CARDS assigns cards to player', () => {
    const state = createInitialState(makePlayers(2), 0, 5, 10, 1);
    const cards: [any, any] = [createCard('A', 'spades'), createCard('K', 'hearts')];
    const next = applyAction(state, { type: 'DEAL_HOLE_CARDS', playerId: 'p1', cards });
    expect(next.players[0].holeCards).toEqual(cards);
    expect(state.players[0].holeCards).toBeNull(); // immutability
  });

  it('DEAL_COMMUNITY adds community cards', () => {
    const state = createInitialState(makePlayers(2), 0, 5, 10, 1);
    const flop = [createCard('A', 'clubs'), createCard('K', 'clubs'), createCard('Q', 'clubs')];
    const next = applyAction(state, { type: 'DEAL_COMMUNITY', cards: flop });
    expect(next.communityCards).toHaveLength(3);
    expect(state.communityCards).toHaveLength(0);
  });

  it('PLAYER_ACTION fold marks player folded', () => {
    const state = createInitialState(makePlayers(2), 0, 5, 10, 1);
    const next = applyAction(state, {
      type: 'PLAYER_ACTION', playerId: 'p1',
      action: { type: 'fold', amount: 0 },
    });
    expect(next.players[0].folded).toBe(true);
  });

  it('PLAYER_ACTION raise updates minRaise', () => {
    let state = createInitialState(makePlayers(3), 0, 5, 10, 1);
    state = applyAction(state, { type: 'POST_BLINDS', smallBlind: 5, bigBlind: 10 });
    // p1 raises to 30 (20 more than BB's 10)
    state = applyAction(state, {
      type: 'PLAYER_ACTION', playerId: 'p1',
      action: { type: 'raise', amount: 30 },
    });
    expect(state.players[0].currentBet).toBe(30);
    expect(state.minRaise).toBe(20); // raise was 20 over the 10
  });

  it('ADVANCE_STREET moves to next street and resets bets', () => {
    let state = createInitialState(makePlayers(2), 0, 5, 10, 1);
    state = applyAction(state, { type: 'POST_BLINDS', smallBlind: 5, bigBlind: 10 });
    expect(state.street).toBe('preflop');

    state = applyAction(state, { type: 'ADVANCE_STREET' });
    expect(state.street).toBe('flop');
    expect(state.players.every(p => p.currentBet === 0)).toBe(true);

    state = applyAction(state, { type: 'ADVANCE_STREET' });
    expect(state.street).toBe('turn');

    state = applyAction(state, { type: 'ADVANCE_STREET' });
    expect(state.street).toBe('river');
  });

  it('COLLECT_BETS adds current bets to pot', () => {
    let state = createInitialState(makePlayers(2), 0, 5, 10, 1);
    state = applyAction(state, { type: 'POST_BLINDS', smallBlind: 5, bigBlind: 10 });
    state = applyAction(state, { type: 'COLLECT_BETS' });
    expect(state.pot).toBe(15);
    expect(state.players.every(p => p.currentBet === 0)).toBe(true);
  });

  it('NEXT_PLAYER skips folded and all-in players', () => {
    let state = createInitialState(makePlayers(4), 0, 5, 10, 1);
    state.currentPlayerIndex = 0;
    state.players[1].folded = true;
    state.players[2].allIn = true;
    state = applyAction(state, { type: 'NEXT_PLAYER' });
    expect(state.currentPlayerIndex).toBe(3);
  });

  it('END_HAND sets isHandOver', () => {
    const state = createInitialState(makePlayers(2), 0, 5, 10, 1);
    const next = applyAction(state, { type: 'END_HAND' });
    expect(next.isHandOver).toBe(true);
  });
});

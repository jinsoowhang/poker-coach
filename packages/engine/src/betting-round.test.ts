import { describe, it, expect } from 'vitest';
import { getValidActions, applyBet, postBlinds, nextActivePlayer, countActivePlayers, countPlayersInHand } from './betting-round.js';
import type { Player, GameState } from './types.js';

function makePlayer(id: string, overrides: Partial<Player> = {}): Player {
  return {
    id, name: id, chips: 1000, holeCards: null,
    currentBet: 0, totalBetThisRound: 0,
    folded: false, allIn: false, seatIndex: 0, isHuman: false,
    ...overrides,
  };
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    handNumber: 1,
    players: [makePlayer('p1'), makePlayer('p2'), makePlayer('p3')],
    communityCards: [],
    street: 'preflop',
    pot: 0,
    sidePots: [],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    smallBlind: 5,
    bigBlind: 10,
    lastRaiseAmount: 10,
    minRaise: 10,
    isHandOver: false,
    ...overrides,
  };
}

describe('getValidActions', () => {
  it('allows check when no bet to face', () => {
    const state = makeState();
    const actions = getValidActions(state);
    const types = actions.map(a => a.type);
    expect(types).toContain('check');
    expect(types).not.toContain('call');
  });

  it('allows call when facing a bet', () => {
    const state = makeState({
      players: [
        makePlayer('p1', { currentBet: 0 }),
        makePlayer('p2', { currentBet: 20 }),
      ],
      currentPlayerIndex: 0,
    });
    const actions = getValidActions(state);
    const types = actions.map(a => a.type);
    expect(types).toContain('call');
    expect(types).toContain('fold');
    expect(types).not.toContain('check');
  });

  it('includes raise with correct min amount', () => {
    const state = makeState({
      players: [
        makePlayer('p1', { currentBet: 0, chips: 1000 }),
        makePlayer('p2', { currentBet: 20 }),
      ],
      currentPlayerIndex: 0,
      minRaise: 20,
      bigBlind: 10,
    });
    const actions = getValidActions(state);
    const raise = actions.find(a => a.type === 'raise');
    expect(raise).toBeDefined();
    // Min raise total = 20 (highest) + 20 (minRaise) = 40, minus current bet (0) = 40
    expect(raise!.minAmount).toBe(40);
    expect(raise!.maxAmount).toBe(1000);
  });

  it('returns empty for folded player', () => {
    const state = makeState({
      players: [makePlayer('p1', { folded: true }), makePlayer('p2')],
      currentPlayerIndex: 0,
    });
    expect(getValidActions(state)).toEqual([]);
  });
});

describe('applyBet', () => {
  it('fold marks player as folded', () => {
    const player = makePlayer('p1');
    applyBet(player, { type: 'fold', amount: 0 });
    expect(player.folded).toBe(true);
  });

  it('call deducts chips and increases bet', () => {
    const player = makePlayer('p1', { chips: 1000 });
    applyBet(player, { type: 'call', amount: 50 });
    expect(player.chips).toBe(950);
    expect(player.currentBet).toBe(50);
    expect(player.totalBetThisRound).toBe(50);
  });

  it('all-in sets chips to 0', () => {
    const player = makePlayer('p1', { chips: 300 });
    applyBet(player, { type: 'all-in', amount: 300 });
    expect(player.chips).toBe(0);
    expect(player.allIn).toBe(true);
    expect(player.currentBet).toBe(300);
  });
});

describe('postBlinds', () => {
  it('posts small and big blinds correctly', () => {
    const players = [makePlayer('p1'), makePlayer('p2'), makePlayer('p3')];
    const [sbIdx, bbIdx] = postBlinds(players, 0, 5, 10);
    expect(sbIdx).toBe(1);
    expect(bbIdx).toBe(2);
    expect(players[1].currentBet).toBe(5);
    expect(players[2].currentBet).toBe(10);
    expect(players[1].chips).toBe(995);
    expect(players[2].chips).toBe(990);
  });

  it('heads-up: dealer posts small blind', () => {
    const players = [makePlayer('p1'), makePlayer('p2')];
    const [sbIdx, bbIdx] = postBlinds(players, 0, 5, 10);
    expect(sbIdx).toBe(0); // dealer is SB
    expect(bbIdx).toBe(1);
  });

  it('handles short-stacked player (all-in on blind)', () => {
    const players = [makePlayer('p1'), makePlayer('p2', { chips: 3 }), makePlayer('p3')];
    postBlinds(players, 0, 5, 10);
    expect(players[1].chips).toBe(0);
    expect(players[1].allIn).toBe(true);
    expect(players[1].currentBet).toBe(3);
  });
});

describe('nextActivePlayer', () => {
  it('finds next non-folded non-all-in player', () => {
    const players = [
      makePlayer('p1'),
      makePlayer('p2', { folded: true }),
      makePlayer('p3'),
    ];
    expect(nextActivePlayer(players, 0)).toBe(2);
  });

  it('wraps around', () => {
    const players = [makePlayer('p1'), makePlayer('p2'), makePlayer('p3')];
    expect(nextActivePlayer(players, 2)).toBe(0);
  });

  it('returns -1 when no active player', () => {
    const players = [
      makePlayer('p1', { folded: true }),
      makePlayer('p2', { allIn: true }),
    ];
    expect(nextActivePlayer(players, 0)).toBe(-1);
  });
});

describe('countActivePlayers / countPlayersInHand', () => {
  it('counts correctly', () => {
    const players = [
      makePlayer('p1'),
      makePlayer('p2', { folded: true }),
      makePlayer('p3', { allIn: true }),
      makePlayer('p4'),
    ];
    expect(countActivePlayers(players)).toBe(2); // p1, p4
    expect(countPlayersInHand(players)).toBe(3); // p1, p3, p4
  });
});

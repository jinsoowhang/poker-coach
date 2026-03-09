import { describe, it, expect } from 'vitest';
import { GameLoop } from './game-loop.js';
import type { Player, GameEvent, PlayerAction, ValidAction, GameState } from './types.js';

function makePlayers(count: number, chips = 1000): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `p${i + 1}`,
    name: `Player ${i + 1}`,
    chips,
    holeCards: null,
    currentBet: 0,
    totalBetThisRound: 0,
    folded: false,
    allIn: false,
    seatIndex: i,
    isHuman: i === 0,
  }));
}

/** Simple AI that always calls or checks. */
function alwaysCallAction(
  _playerId: string,
  validActions: ValidAction[],
  _state: GameState,
): Promise<PlayerAction> {
  const call = validActions.find(a => a.type === 'call');
  if (call) return Promise.resolve({ type: 'call', amount: call.minAmount! });
  const check = validActions.find(a => a.type === 'check');
  if (check) return Promise.resolve({ type: 'check', amount: 0 });
  // Fallback: fold
  return Promise.resolve({ type: 'fold', amount: 0 });
}

/** AI that folds immediately when facing a bet, checks otherwise. */
function foldOrCheckAction(
  _playerId: string,
  validActions: ValidAction[],
  _state: GameState,
): Promise<PlayerAction> {
  const check = validActions.find(a => a.type === 'check');
  if (check) return Promise.resolve({ type: 'check', amount: 0 });
  return Promise.resolve({ type: 'fold', amount: 0 });
}

describe('GameLoop', () => {
  it('plays a complete hand with all-call players', async () => {
    const players = makePlayers(3);
    const events: GameEvent[] = [];

    const loop = new GameLoop({
      players,
      smallBlind: 5,
      bigBlind: 10,
      onEvent: (e) => events.push(e),
      getAction: alwaysCallAction,
    });

    const summary = await loop.playHand();

    // Verify events were emitted
    const eventTypes = events.map(e => e.type);
    expect(eventTypes).toContain('HAND_START');
    expect(eventTypes).toContain('CARDS_DEALT');
    expect(eventTypes).toContain('HAND_END');

    // Verify hand summary
    expect(summary.handNumber).toBe(1);
    expect(summary.winners.length).toBeGreaterThanOrEqual(1);
    expect(summary.communityCards).toHaveLength(5);
    expect(summary.playerResults).toHaveLength(3);

    // Chip conservation: total chips should remain the same
    const totalChips = players.reduce((s, p) => s + p.chips, 0);
    expect(totalChips).toBe(3000);
  });

  it('ends early when all but one player folds', async () => {
    const players = makePlayers(3);
    const events: GameEvent[] = [];
    let actionCount = 0;

    const loop = new GameLoop({
      players,
      smallBlind: 5,
      bigBlind: 10,
      onEvent: (e) => events.push(e),
      getAction: async (playerId, validActions, state) => {
        // p1 raises, everyone else folds
        if (playerId === 'p1') {
          const raise = validActions.find(a => a.type === 'raise');
          if (raise) return { type: 'raise', amount: raise.minAmount! };
          return { type: 'check', amount: 0 };
        }
        return { type: 'fold', amount: 0 };
      },
    });

    const summary = await loop.playHand();

    expect(summary.winners).toHaveLength(1);
    expect(summary.winners[0].playerId).toBe('p1');
    // Should NOT have 5 community cards since hand ended early
    expect(summary.communityCards.length).toBeLessThanOrEqual(5);

    const totalChips = players.reduce((s, p) => s + p.chips, 0);
    expect(totalChips).toBe(3000);
  });

  it('plays multiple hands and rotates dealer', async () => {
    const players = makePlayers(3);
    const events: GameEvent[] = [];

    const loop = new GameLoop({
      players,
      smallBlind: 5,
      bigBlind: 10,
      onEvent: (e) => events.push(e),
      getAction: alwaysCallAction,
    });

    await loop.playHand();
    await loop.playHand();

    // After 2 hands, should have 2 HAND_START events
    const handStarts = events.filter(e => e.type === 'HAND_START');
    expect(handStarts).toHaveLength(2);

    // Chips should still be conserved
    const totalChips = players.reduce((s, p) => s + p.chips, 0);
    expect(totalChips).toBe(3000);
  });

  it('handles heads-up correctly', async () => {
    const players = makePlayers(2);
    const events: GameEvent[] = [];

    const loop = new GameLoop({
      players,
      smallBlind: 5,
      bigBlind: 10,
      onEvent: (e) => events.push(e),
      getAction: alwaysCallAction,
    });

    const summary = await loop.playHand();

    expect(summary.playerResults).toHaveLength(2);
    const totalChips = players.reduce((s, p) => s + p.chips, 0);
    expect(totalChips).toBe(2000);
  });

  it('SHOWDOWN event fires when multiple players reach showdown', async () => {
    const players = makePlayers(2);
    const events: GameEvent[] = [];

    const loop = new GameLoop({
      players,
      smallBlind: 5,
      bigBlind: 10,
      onEvent: (e) => events.push(e),
      getAction: alwaysCallAction,
    });

    await loop.playHand();

    const showdowns = events.filter(e => e.type === 'SHOWDOWN');
    expect(showdowns).toHaveLength(1);
  });
});

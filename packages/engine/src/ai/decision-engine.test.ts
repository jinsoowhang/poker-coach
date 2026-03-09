import { describe, it, expect } from 'vitest';
import { estimatePreflopStrength, estimatePostflopStrength, makeDecision, createAiActionProvider } from './decision-engine.js';
import { TAG, LP } from './personalities.js';
import { createCard } from '../card.js';
import type { Card, ValidAction, GameState, Player } from '../types.js';

const c = createCard;

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    handNumber: 1,
    players: [],
    communityCards: [],
    street: 'preflop',
    pot: 100,
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

describe('estimatePreflopStrength', () => {
  it('rates pocket aces highest', () => {
    const aces = estimatePreflopStrength([c('A', 'spades'), c('A', 'hearts')]);
    const deuces = estimatePreflopStrength([c('2', 'clubs'), c('2', 'diamonds')]);
    expect(aces).toBeGreaterThan(deuces);
    expect(aces).toBeGreaterThan(0.7);
  });

  it('rates suited connectors higher than offsuit disconnected', () => {
    const suitedConnector = estimatePreflopStrength([c('J', 'hearts'), c('10', 'hearts')]);
    const offsuit = estimatePreflopStrength([c('J', 'hearts'), c('4', 'clubs')]);
    expect(suitedConnector).toBeGreaterThan(offsuit);
  });

  it('returns value between 0 and 1', () => {
    const strength = estimatePreflopStrength([c('7', 'hearts'), c('2', 'clubs')]);
    expect(strength).toBeGreaterThanOrEqual(0);
    expect(strength).toBeLessThanOrEqual(1);
  });

  it('rates AK higher than 72o', () => {
    const ak = estimatePreflopStrength([c('A', 'spades'), c('K', 'spades')]);
    const worst = estimatePreflopStrength([c('7', 'hearts'), c('2', 'clubs')]);
    expect(ak).toBeGreaterThan(worst);
  });
});

describe('estimatePostflopStrength', () => {
  it('rates a flush higher than high card', () => {
    const flushHand: [Card, Card] = [c('A', 'hearts'), c('K', 'hearts')];
    const flushBoard: Card[] = [c('Q', 'hearts'), c('J', 'hearts'), c('2', 'hearts')];

    const highCardHand: [Card, Card] = [c('A', 'spades'), c('K', 'diamonds')];
    const highCardBoard: Card[] = [c('3', 'hearts'), c('7', 'clubs'), c('9', 'diamonds')];

    const flushStrength = estimatePostflopStrength(flushHand, flushBoard);
    const highCardStrength = estimatePostflopStrength(highCardHand, highCardBoard);

    expect(flushStrength).toBeGreaterThan(highCardStrength);
  });
});

describe('makeDecision', () => {
  const standardActions: ValidAction[] = [
    { type: 'fold' },
    { type: 'call', minAmount: 10, maxAmount: 10 },
    { type: 'raise', minAmount: 20, maxAmount: 1000 },
    { type: 'all-in', minAmount: 1000, maxAmount: 1000 },
  ];

  it('TAG folds weak hands', () => {
    // Run multiple times to account for randomness
    let foldCount = 0;
    for (let i = 0; i < 50; i++) {
      const decision = makeDecision(TAG, 0.1, standardActions, makeState(), 'p1');
      if (decision.action.type === 'fold') foldCount++;
    }
    // TAG with 0.1 strength should fold most of the time
    expect(foldCount).toBeGreaterThan(30);
  });

  it('LP plays more hands than TAG at same strength', () => {
    // Use strength between LP threshold (0.45) and TAG threshold (0.78)
    // At 0.55, LP should play often while TAG mostly folds
    let tagPlays = 0;
    let lpPlays = 0;
    for (let i = 0; i < 100; i++) {
      const tagD = makeDecision(TAG, 0.55, standardActions, makeState(), 'p1');
      const lpD = makeDecision(LP, 0.55, standardActions, makeState(), 'p1');
      if (tagD.action.type !== 'fold') tagPlays++;
      if (lpD.action.type !== 'fold') lpPlays++;
    }
    expect(lpPlays).toBeGreaterThan(tagPlays);
  });

  it('returns check when no bet to face and hand is weak', () => {
    const checkActions: ValidAction[] = [
      { type: 'fold' },
      { type: 'check' },
      { type: 'raise', minAmount: 10, maxAmount: 1000 },
    ];
    // Weak hand, should mostly check
    let checkCount = 0;
    for (let i = 0; i < 50; i++) {
      const decision = makeDecision(TAG, 0.3, checkActions, makeState(), 'p1');
      if (decision.action.type === 'check') checkCount++;
    }
    expect(checkCount).toBeGreaterThan(20);
  });

  it('decision always includes reasoning', () => {
    const decision = makeDecision(TAG, 0.5, standardActions, makeState(), 'p1');
    expect(decision.reasoning).toBeTruthy();
    expect(decision.reasoning.length).toBeGreaterThan(0);
  });
});

describe('createAiActionProvider', () => {
  it('returns a function that produces valid actions', async () => {
    const provider = createAiActionProvider(TAG);
    const state = makeState({
      players: [{
        id: 'p1', name: 'AI', chips: 1000,
        holeCards: [c('A', 'spades'), c('K', 'hearts')],
        currentBet: 0, totalBetThisRound: 0,
        folded: false, allIn: false, seatIndex: 0, isHuman: false,
      }],
    });

    const validActions: ValidAction[] = [
      { type: 'fold' },
      { type: 'call', minAmount: 10, maxAmount: 10 },
      { type: 'raise', minAmount: 20, maxAmount: 1000 },
    ];

    const action = await provider('p1', validActions, state);
    expect(['fold', 'call', 'raise', 'check', 'all-in']).toContain(action.type);
  });
});

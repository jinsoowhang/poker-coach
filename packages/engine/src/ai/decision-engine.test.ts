import { describe, it, expect } from 'vitest';
import { estimatePreflopStrength, estimatePostflopStrength, makeDecision, createAiActionProvider } from './decision-engine.js';
import { TAG, LP, TP, LAG } from './personalities.js';
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
    expect(aces).toBeGreaterThan(0.85);
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
    expect(ak).toBeGreaterThan(0.65);
  });

  it('pairs are in expected ranges', () => {
    const twos = estimatePreflopStrength([c('2', 'clubs'), c('2', 'diamonds')]);
    const tens = estimatePreflopStrength([c('10', 'hearts'), c('10', 'spades')]);
    const aces = estimatePreflopStrength([c('A', 'spades'), c('A', 'hearts')]);

    expect(twos).toBeGreaterThan(0.4);
    expect(twos).toBeLessThan(0.55);
    expect(tens).toBeGreaterThan(0.7);
    expect(aces).toBeGreaterThan(0.9);
  });

  it('72o is the worst hand', () => {
    const worst = estimatePreflopStrength([c('7', 'hearts'), c('2', 'clubs')]);
    expect(worst).toBeLessThan(0.20);
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
    expect(flushStrength).toBeGreaterThan(0.85);
  });

  it('one pair is in a reasonable range', () => {
    const pairHand: [Card, Card] = [c('K', 'hearts'), c('Q', 'spades')];
    const pairBoard: Card[] = [c('K', 'clubs'), c('7', 'diamonds'), c('3', 'hearts')];

    const strength = estimatePostflopStrength(pairHand, pairBoard);
    expect(strength).toBeGreaterThan(0.30);
    expect(strength).toBeLessThan(0.55);
  });

  it('two pair is stronger than one pair', () => {
    const twoPairHand: [Card, Card] = [c('K', 'hearts'), c('Q', 'spades')];
    const twoPairBoard: Card[] = [c('K', 'clubs'), c('Q', 'diamonds'), c('3', 'hearts')];

    const pairHand: [Card, Card] = [c('K', 'hearts'), c('J', 'spades')];
    const pairBoard: Card[] = [c('K', 'clubs'), c('7', 'diamonds'), c('3', 'hearts')];

    expect(estimatePostflopStrength(twoPairHand, twoPairBoard))
      .toBeGreaterThan(estimatePostflopStrength(pairHand, pairBoard));
  });
});

describe('makeDecision', () => {
  const standardActions: ValidAction[] = [
    { type: 'fold' },
    { type: 'call', minAmount: 10, maxAmount: 10 },
    { type: 'raise', minAmount: 20, maxAmount: 1000 },
    { type: 'all-in', minAmount: 1000, maxAmount: 1000 },
  ];

  it('TAG folds weak hands preflop', () => {
    let foldCount = 0;
    for (let i = 0; i < 50; i++) {
      const decision = makeDecision(TAG, 0.15, standardActions, makeState(), 'p1');
      if (decision.action.type === 'fold') foldCount++;
    }
    // 0.15 strength is trash — TAG should fold most of the time
    expect(foldCount).toBeGreaterThan(30);
  });

  it('LP plays more hands than TAG at same strength', () => {
    let tagPlays = 0;
    let lpPlays = 0;
    for (let i = 0; i < 100; i++) {
      const tagD = makeDecision(TAG, 0.35, standardActions, makeState(), 'p1');
      const lpD = makeDecision(LP, 0.35, standardActions, makeState(), 'p1');
      if (tagD.action.type !== 'fold') tagPlays++;
      if (lpD.action.type !== 'fold') lpPlays++;
    }
    expect(lpPlays).toBeGreaterThan(tagPlays);
  });

  it('AI does NOT fold medium+ hands to a raise preflop', () => {
    // 0.55 is like KJs or pocket 7s — should play this hand
    let foldCount = 0;
    for (let i = 0; i < 50; i++) {
      const decision = makeDecision(LAG, 0.55, standardActions, makeState(), 'p1');
      if (decision.action.type === 'fold') foldCount++;
    }
    // LAG with decent hand should almost never fold
    expect(foldCount).toBeLessThan(10);
  });

  it('AI calls or raises with strong hands postflop', () => {
    const postflopState = makeState({ street: 'flop', pot: 200 });
    // 0.55 = two pair range — should not fold
    let playCount = 0;
    for (let i = 0; i < 50; i++) {
      const decision = makeDecision(TAG, 0.55, standardActions, postflopState, 'p1');
      if (decision.action.type !== 'fold') playCount++;
    }
    expect(playCount).toBeGreaterThan(40);
  });

  it('returns check when no bet to face and hand is weak', () => {
    const checkActions: ValidAction[] = [
      { type: 'fold' },
      { type: 'check' },
      { type: 'raise', minAmount: 10, maxAmount: 1000 },
    ];
    let checkCount = 0;
    for (let i = 0; i < 50; i++) {
      const decision = makeDecision(TAG, 0.3, checkActions, makeState(), 'p1');
      if (decision.action.type === 'check') checkCount++;
    }
    expect(checkCount).toBeGreaterThan(20);
  });

  it('pot-committed player does not easily fold postflop', () => {
    const committed = makeState({
      street: 'turn',
      pot: 500,
      players: [{
        id: 'p1', name: 'AI', chips: 200,
        holeCards: [c('8', 'hearts'), c('9', 'hearts')],
        currentBet: 0, totalBetThisRound: 300,
        folded: false, allIn: false, seatIndex: 0, isHuman: false,
      }],
    });
    let foldCount = 0;
    for (let i = 0; i < 50; i++) {
      const decision = makeDecision(TAG, 0.30, standardActions, committed, 'p1');
      if (decision.action.type === 'fold') foldCount++;
    }
    // Pot committed with 300 invested and only 200 left — should rarely fold
    expect(foldCount).toBeLessThan(15);
  });

  it('decision always includes reasoning', () => {
    const decision = makeDecision(TAG, 0.5, standardActions, makeState(), 'p1');
    expect(decision.reasoning).toBeTruthy();
    expect(decision.reasoning.length).toBeGreaterThan(0);
  });

  it('aggressive personalities raise more often', () => {
    let tagRaises = 0;
    let tpRaises = 0;
    for (let i = 0; i < 100; i++) {
      const tagD = makeDecision(TAG, 0.65, standardActions, makeState(), 'p1');
      const tpD = makeDecision(TP, 0.65, standardActions, makeState(), 'p1');
      if (tagD.action.type === 'raise') tagRaises++;
      if (tpD.action.type === 'raise') tpRaises++;
    }
    expect(tagRaises).toBeGreaterThan(tpRaises);
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

  it('AI with AKs preflop mostly plays (call or raise)', async () => {
    const provider = createAiActionProvider(TAG);
    const state = makeState({
      players: [{
        id: 'p1', name: 'AI', chips: 1000,
        holeCards: [c('A', 'spades'), c('K', 'spades')],
        currentBet: 0, totalBetThisRound: 0,
        folded: false, allIn: false, seatIndex: 0, isHuman: false,
      }],
    });

    const validActions: ValidAction[] = [
      { type: 'fold' },
      { type: 'call', minAmount: 20, maxAmount: 20 },
      { type: 'raise', minAmount: 40, maxAmount: 1000 },
    ];

    let playCount = 0;
    for (let i = 0; i < 30; i++) {
      const action = await provider('p1', validActions, state);
      if (action.type !== 'fold') playCount++;
    }
    // AKs is a premium hand — should play nearly every time
    expect(playCount).toBeGreaterThan(25);
  });
});

// @poker-coach/engine — entry point
export const ENGINE_VERSION = '0.1.0';

export * from './types.js';
export * from './card.js';
export { Deck } from './deck.js';
export { evaluateHand, compareHands, findWinnerIndices } from './hand-evaluator.js';
export type { EvaluatedHand } from './hand-evaluator.js';
export { evaluatePlayerHands, determineWinners } from './hand-rank.js';
export { calculateSidePots, collectBets } from './pot-manager.js';
export { getValidActions, applyBet, postBlinds, nextActivePlayer, countActivePlayers, countPlayersInHand } from './betting-round.js';
export { createInitialState, applyAction } from './game-state.js';
export type { GameAction } from './game-state.js';
export { GameLoop } from './game-loop.js';
export type { ActionProvider, GameLoopConfig } from './game-loop.js';
export { TAG, LP, TP, LAG, ALL_PERSONALITIES } from './ai/personalities.js';
export { estimatePreflopStrength, estimatePostflopStrength, makeDecision, createAiActionProvider } from './ai/decision-engine.js';
export { getActionDelay } from './ai/action-timing.js';
export { calculatePotOdds, countOuts, totalUniqueOuts } from './odds-calculator.js';
export type { PotOdds, OutInfo } from './odds-calculator.js';

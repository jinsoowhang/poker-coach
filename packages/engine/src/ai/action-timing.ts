import { ActionType, AiPersonality } from '../types.js';

const BASE_DELAYS: Record<ActionType, [number, number]> = {
  fold: [800, 1500],
  check: [1200, 2500],
  call: [1200, 2500],
  raise: [1500, 3500],
  'all-in': [2000, 4000],
};

export function getActionDelay(actionType: ActionType, personality: AiPersonality): number {
  const [min, max] = BASE_DELAYS[actionType];
  const base = min + Math.random() * (max - min);
  return Math.round(base * personality.speedModifier);
}

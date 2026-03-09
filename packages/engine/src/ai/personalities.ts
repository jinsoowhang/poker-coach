import { AiPersonality } from '../types.js';

/**
 * Tight-Aggressive (TAG): Plays few hands but bets/raises aggressively.
 * Think: the solid pro at the table.
 */
export const TAG: AiPersonality = {
  type: 'TAG',
  name: 'Tight-Aggressive',
  vpip: 0.22,          // plays ~22% of hands
  aggression: 0.75,    // heavily prefers raising over calling
  bluffFrequency: 0.15,
  speedModifier: 1.0,  // normal speed
};

/**
 * Loose-Passive (LP): Plays many hands but rarely raises.
 * Think: the calling station.
 */
export const LP: AiPersonality = {
  type: 'LP',
  name: 'Loose-Passive',
  vpip: 0.55,          // plays ~55% of hands
  aggression: 0.2,     // mostly calls
  bluffFrequency: 0.05,
  speedModifier: 1.1,  // slightly slow
};

/**
 * Tight-Passive (TP): Plays few hands and rarely raises.
 * Think: the rock who only calls with the nuts.
 */
export const TP: AiPersonality = {
  type: 'TP',
  name: 'Tight-Passive',
  vpip: 0.18,
  aggression: 0.15,
  bluffFrequency: 0.02,
  speedModifier: 1.3,  // slow/deliberate
};

/**
 * Loose-Aggressive (LAG): Plays many hands and bets/raises often.
 * Think: the maniac who keeps you guessing.
 */
export const LAG: AiPersonality = {
  type: 'LAG',
  name: 'Loose-Aggressive',
  vpip: 0.50,
  aggression: 0.70,
  bluffFrequency: 0.30,
  speedModifier: 0.7,  // fast/impulsive
};

export const ALL_PERSONALITIES: AiPersonality[] = [TAG, LP, TP, LAG];

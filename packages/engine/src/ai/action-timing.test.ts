import { describe, it, expect, vi, afterEach } from 'vitest';
import { getActionDelay } from './action-timing.js';
import { TAG, LAG, TP } from './personalities.js';

describe('getActionDelay', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns delay within expected range for TAG fold', () => {
    // TAG speedModifier = 1.0, fold base = [800, 1500]
    // So result should be in [800, 1500]
    for (let i = 0; i < 50; i++) {
      const delay = getActionDelay('fold', TAG);
      expect(delay).toBeGreaterThanOrEqual(800);
      expect(delay).toBeLessThanOrEqual(1500);
    }
  });

  it('LAG is faster than TP on average for the same action', () => {
    // Use a fixed random to make this deterministic
    const samples = 200;
    let lagTotal = 0;
    let tpTotal = 0;

    for (let i = 0; i < samples; i++) {
      lagTotal += getActionDelay('call', LAG);
      tpTotal += getActionDelay('call', TP);
    }

    const lagAvg = lagTotal / samples;
    const tpAvg = tpTotal / samples;

    // LAG speedModifier 0.7 vs TP speedModifier 1.3
    // LAG average should be noticeably lower
    expect(lagAvg).toBeLessThan(tpAvg);
  });

  it('all-in has longest base delay vs fold', () => {
    // Fix Math.random to 0.5 to get midpoint of each range
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const foldDelay = getActionDelay('fold', TAG);
    const allInDelay = getActionDelay('all-in', TAG);

    // fold midpoint: 800 + 0.5 * 700 = 1150
    // all-in midpoint: 2000 + 0.5 * 2000 = 3000
    expect(allInDelay).toBeGreaterThan(foldDelay);
  });

  it('speedModifier scales the delay proportionally', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const tagDelay = getActionDelay('raise', TAG);   // speedModifier 1.0
    const lagDelay = getActionDelay('raise', LAG);   // speedModifier 0.7
    const tpDelay = getActionDelay('raise', TP);     // speedModifier 1.3

    // raise midpoint = 1500 + 0.5 * 2000 = 2500
    expect(tagDelay).toBe(2500);
    expect(lagDelay).toBe(Math.round(2500 * 0.7));   // 1750
    expect(tpDelay).toBe(Math.round(2500 * 1.3));    // 3250
  });
});

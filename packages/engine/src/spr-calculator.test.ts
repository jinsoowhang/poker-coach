import { describe, it, expect } from 'vitest';
import { calculateSPR } from './spr-calculator.js';

describe('calculateSPR', () => {
  it('classifies low SPR (≤ 3)', () => {
    const a = calculateSPR(55, 21);
    expect(a.spr).toBeCloseTo(2.6, 1);
    expect(a.tier).toBe('low');
    expect(a.commitment).toMatch(/commit/i);
  });

  it('classifies medium SPR (4–8)', () => {
    const a = calculateSPR(120, 20);
    expect(a.spr).toBe(6);
    expect(a.tier).toBe('medium');
    expect(a.commitment).toMatch(/two-pair|pot-control/i);
  });

  it('classifies high SPR (≥ 9)', () => {
    const a = calculateSPR(300, 20);
    expect(a.spr).toBe(15);
    expect(a.tier).toBe('high');
    expect(a.commitment).toMatch(/strong/i);
  });

  it('boundary at 3 is low', () => {
    const a = calculateSPR(60, 20);
    expect(a.spr).toBe(3);
    expect(a.tier).toBe('low');
  });

  it('boundary at 8 is medium', () => {
    const a = calculateSPR(160, 20);
    expect(a.spr).toBe(8);
    expect(a.tier).toBe('medium');
  });

  it('boundary at 9 is high', () => {
    const a = calculateSPR(180, 20);
    expect(a.spr).toBe(9);
    expect(a.tier).toBe('high');
  });

  it('handles zero pot safely', () => {
    const a = calculateSPR(100, 0);
    expect(a.spr).toBe(0);
    expect(a.tier).toBe('low');
  });

  it('handles zero stack safely', () => {
    const a = calculateSPR(0, 50);
    expect(a.spr).toBe(0);
    expect(a.tier).toBe('low');
  });
});

import { describe, it, expect } from 'vitest';
import {
  fuelCostPerYear,
  rrcSavingsFraction,
  annualSavings,
  cumulativeSavingsOverMonths,
  breakEvenMonths,
} from '../js/calc.js';

describe('fuelCostPerYear', () => {
  it('calculates annual fuel cost', () => {
    // 15000 km, 7 PLN/L, 6.5 L/100km → 15000/100 * 6.5 * 7 = 6825
    expect(fuelCostPerYear(15000, 7, 6.5)).toBe(6825);
  });

  it('returns 0 when km is 0', () => {
    expect(fuelCostPerYear(0, 7, 6.5)).toBe(0);
  });

  it('returns 0 when fuel price is 0', () => {
    expect(fuelCostPerYear(15000, 0, 6.5)).toBe(0);
  });
});

describe('rrcSavingsFraction', () => {
  it('returns 0 when both RRCs are equal', () => {
    expect(rrcSavingsFraction(8.4, 8.4)).toBe(0);
  });

  it('returns positive fraction when compared RRC is lower (better)', () => {
    const fraction = rrcSavingsFraction(8.4, 6.0);
    expect(fraction).toBeGreaterThan(0);
  });

  it('returns negative fraction when compared RRC is higher (worse)', () => {
    const fraction = rrcSavingsFraction(6.0, 8.4);
    expect(fraction).toBeLessThan(0);
  });

  it('applies the 0.2 empirical factor', () => {
    // 50% RRC reduction → 10% fuel reduction
    const fraction = rrcSavingsFraction(10, 5);
    expect(fraction).toBeCloseTo(0.1);
  });

  it('returns 0 when baseRRC is 0', () => {
    expect(rrcSavingsFraction(0, 5)).toBe(0);
  });

  it('returns 0 when baseRRC is negative', () => {
    expect(rrcSavingsFraction(-1, 5)).toBe(0);
  });
});

describe('annualSavings', () => {
  it('returns 0 when both RRCs are equal', () => {
    expect(annualSavings(8.4, 8.4, 15000, 7, 6.5)).toBe(0);
  });

  it('calculates savings for class C (8.4) vs class A (6.0)', () => {
    // baseCost = 15000/100 * 6.5 * 7 = 6825
    // fraction = (8.4 - 6.0) / 8.4 * 0.2 = 0.0571428...
    // saving = 6825 * 0.0571428... = 390
    const result = annualSavings(8.4, 6.0, 15000, 7, 6.5);
    expect(result).toBeCloseTo(390, 0);
  });

  it('returns negative when switching to worse tires', () => {
    const result = annualSavings(6.0, 8.4, 15000, 7, 6.5);
    expect(result).toBeLessThan(0);
  });
});

describe('cumulativeSavingsOverMonths', () => {
  it('returns correct number of data points', () => {
    const data = cumulativeSavingsOverMonths(1200, 3, 0);
    // 3 years * 12 months + month 0 = 37 points
    expect(data).toHaveLength(37);
  });

  it('starts at 0 cumulative when no tire price diff', () => {
    const data = cumulativeSavingsOverMonths(1200, 1, 0);
    expect(data[0]).toEqual({ month: 0, cumulative: 0 });
  });

  it('starts negative when tire price diff is set', () => {
    const data = cumulativeSavingsOverMonths(1200, 1, 500);
    expect(data[0]).toEqual({ month: 0, cumulative: -500 });
  });

  it('accumulates monthly savings correctly', () => {
    // 1200/year → 100/month
    const data = cumulativeSavingsOverMonths(1200, 1, 0);
    expect(data[1].cumulative).toBeCloseTo(100);
    expect(data[6].cumulative).toBeCloseTo(600);
    expect(data[12].cumulative).toBeCloseTo(1200);
  });

  it('reaches break-even with tire price difference', () => {
    // 1200/year → 100/month, tire diff 500 → break-even at month 5
    const data = cumulativeSavingsOverMonths(1200, 1, 500);
    expect(data[5].cumulative).toBeCloseTo(0);
    expect(data[6].cumulative).toBeGreaterThan(0);
  });
});

describe('breakEvenMonths', () => {
  it('calculates break-even correctly', () => {
    // 1200/year saving, 500 tire diff → 500/1200 * 12 = 5 months
    expect(breakEvenMonths(1200, 500)).toBe(5);
  });

  it('returns Infinity when annual saving is 0', () => {
    expect(breakEvenMonths(0, 500)).toBe(Infinity);
  });

  it('returns Infinity when annual saving is negative', () => {
    expect(breakEvenMonths(-100, 500)).toBe(Infinity);
  });

  it('returns Infinity when tire price difference is 0', () => {
    expect(breakEvenMonths(1200, 0)).toBe(Infinity);
  });

  it('returns Infinity when tire price difference is negative', () => {
    expect(breakEvenMonths(1200, -100)).toBe(Infinity);
  });
});

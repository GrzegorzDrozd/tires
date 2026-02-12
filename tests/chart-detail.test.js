import { describe, it, expect } from 'vitest';
import { interpolateValue, fadeColor, formatDetailDuration } from '../js/chart-detail.js';

describe('interpolateValue', () => {
  it('returns 0 for null/empty array', () => {
    expect(interpolateValue(null, 5)).toBe(0);
    expect(interpolateValue([], 5)).toBe(0);
  });

  it('returns first element when month <= 0', () => {
    expect(interpolateValue([10, 20, 30], 0)).toBe(10);
    expect(interpolateValue([10, 20, 30], -1)).toBe(10);
  });

  it('returns last element when month >= array length - 1', () => {
    expect(interpolateValue([10, 20, 30], 2)).toBe(30);
    expect(interpolateValue([10, 20, 30], 5)).toBe(30);
  });

  it('returns exact value at integer indices', () => {
    expect(interpolateValue([0, 100, 200, 300], 1)).toBe(100);
    expect(interpolateValue([0, 100, 200, 300], 2)).toBe(200);
  });

  it('interpolates linearly between points', () => {
    expect(interpolateValue([0, 100], 0.5)).toBe(50);
    expect(interpolateValue([0, 100, 200], 0.25)).toBe(25);
    expect(interpolateValue([0, 100, 200], 1.75)).toBe(175);
  });
});

describe('fadeColor', () => {
  it('returns transparent unchanged', () => {
    expect(fadeColor('transparent', '80')).toBe('transparent');
  });

  it('returns null/empty unchanged', () => {
    expect(fadeColor(null, '80')).toBeNull();
    expect(fadeColor('', '80')).toBe('');
  });

  it('appends alpha to 7-char hex color', () => {
    expect(fadeColor('#16a34a', '99')).toBe('#16a34a99');
  });

  it('replaces existing alpha on 9-char hex color', () => {
    expect(fadeColor('#16a34a22', '99')).toBe('#16a34a99');
  });

  it('returns non-hex colors unchanged', () => {
    expect(fadeColor('rgb(0,0,0)', '80')).toBe('rgb(0,0,0)');
  });
});

describe('formatDetailDuration', () => {
  const loc = { yearShort: 'yr', monthShort: 'mo' };

  it('formats months only', () => {
    expect(formatDetailDuration(5, loc)).toBe('5 mo');
  });

  it('formats years only', () => {
    expect(formatDetailDuration(24, loc)).toBe('2 yr');
  });

  it('formats years and months', () => {
    expect(formatDetailDuration(15, loc)).toBe('1 yr 3 mo');
  });

  it('formats zero as 0 monthShort', () => {
    expect(formatDetailDuration(0, loc)).toBe('0 mo');
  });

  it('rounds fractional months', () => {
    expect(formatDetailDuration(5.7, loc)).toBe('6 mo');
  });
});

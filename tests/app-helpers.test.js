import { describe, it, expect, beforeAll } from 'vitest';
import { LOCALES } from '../data/i18n.js';

// Set up globals that app.js helpers depend on
globalThis.LOCALES = LOCALES;

import { t, pluralYears, pluralMonths, formatDuration, setLocale } from '../js/app.js';

describe('t (translation helper)', () => {
  it('returns Polish string for current locale', () => {
    setLocale('pl');
    expect(t('baseline')).toBe('Baza');
  });

  it('returns English string when locale is en', () => {
    setLocale('en');
    expect(t('baseline')).toBe('Baseline');
  });

  it('returns key as fallback for missing translation', () => {
    expect(t('nonExistentKey')).toBe('nonExistentKey');
  });

  it('falls back to Polish for unknown locale', () => {
    setLocale('xx');
    expect(t('baseline')).toBe('Baza');
  });
});

describe('pluralYears (Polish)', () => {
  beforeAll(() => { setLocale('pl'); });

  it('returns singular for 1', () => {
    expect(pluralYears(1, 'pl')).toBe('rok');
  });

  it('returns plural (2-4) for 2', () => {
    expect(pluralYears(2, 'pl')).toBe('lata');
  });

  it('returns plural (2-4) for 3', () => {
    expect(pluralYears(3, 'pl')).toBe('lata');
  });

  it('returns plural many for 5', () => {
    expect(pluralYears(5, 'pl')).toBe('lat');
  });

  it('returns plural many for 12', () => {
    expect(pluralYears(12, 'pl')).toBe('lat');
  });

  it('returns plural (2-4) for 22', () => {
    expect(pluralYears(22, 'pl')).toBe('lata');
  });

  it('returns plural many for 11', () => {
    expect(pluralYears(11, 'pl')).toBe('lat');
  });

  it('returns plural many for 14', () => {
    expect(pluralYears(14, 'pl')).toBe('lat');
  });
});

describe('pluralYears (English)', () => {
  beforeAll(() => { setLocale('en'); });

  it('returns singular for 1', () => {
    expect(pluralYears(1, 'en')).toBe('year');
  });

  it('returns plural for 2', () => {
    expect(pluralYears(2, 'en')).toBe('years');
  });

  it('returns plural for 5', () => {
    expect(pluralYears(5, 'en')).toBe('years');
  });
});

describe('pluralMonths (Polish)', () => {
  beforeAll(() => { setLocale('pl'); });

  it('returns singular for 1', () => {
    expect(pluralMonths(1, 'pl')).toBe('miesiąc');
  });

  it('returns plural (2-4) for 3', () => {
    expect(pluralMonths(3, 'pl')).toBe('miesiące');
  });

  it('returns plural many for 5', () => {
    expect(pluralMonths(5, 'pl')).toBe('miesięcy');
  });

  it('returns plural many for 12', () => {
    expect(pluralMonths(12, 'pl')).toBe('miesięcy');
  });
});

describe('pluralMonths (English)', () => {
  beforeAll(() => { setLocale('en'); });

  it('returns singular for 1', () => {
    expect(pluralMonths(1, 'en')).toBe('month');
  });

  it('returns plural for 6', () => {
    expect(pluralMonths(6, 'en')).toBe('Months');
  });
});

describe('formatDuration', () => {
  it('formats months only (Polish)', () => {
    setLocale('pl');
    expect(formatDuration(5, 'pl')).toBe('5 miesięcy');
  });

  it('formats years only (Polish)', () => {
    setLocale('pl');
    expect(formatDuration(24, 'pl')).toBe('2 lata');
  });

  it('formats years + months (Polish)', () => {
    setLocale('pl');
    expect(formatDuration(15, 'pl')).toBe('1 rok 3 miesiące');
  });

  it('formats 0 months', () => {
    setLocale('pl');
    expect(formatDuration(0, 'pl')).toBe('0 miesięcy');
  });

  it('formats in English', () => {
    setLocale('en');
    expect(formatDuration(15, 'en')).toBe('1 year 3 Months');
  });

  it('rounds fractional months', () => {
    setLocale('en');
    expect(formatDuration(5.7, 'en')).toBe('6 Months');
  });
});

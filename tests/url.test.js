import { describe, it, expect, beforeEach, vi } from 'vitest';
import { stateToUrl, stateFromUrl, getShareableUrl } from '../js/url.js';

// Mock LZString globally (used by url.js functions)
globalThis.LZString = {
  compressToEncodedURIComponent: (str) => Buffer.from(str).toString('base64url'),
  decompressFromEncodedURIComponent: (str) => Buffer.from(str, 'base64url').toString(),
};

// Mock window globally
globalThis.window = {
  history: { replaceState: vi.fn() },
  location: { hash: '', href: 'http://localhost/' },
};

beforeEach(() => {
  window.location.hash = '';
  window.location.href = 'http://localhost/';
  window.history.replaceState.mockClear();
});

describe('stateToUrl', () => {
  it('compresses state and sets URL hash', () => {
    const state = { l: 'pl', km: 15000 };
    stateToUrl(state);

    expect(window.history.replaceState).toHaveBeenCalledOnce();
    const url = window.history.replaceState.mock.calls[0][2];
    expect(url).toMatch(/^#.+/);
  });
});

describe('stateFromUrl', () => {
  it('returns null when hash is empty', () => {
    window.location.hash = '';
    expect(stateFromUrl()).toBeNull();
  });

  it('returns null for invalid compressed data', () => {
    window.location.hash = '#not-valid-base64url!!!';
    expect(stateFromUrl()).toBeNull();
  });

  it('decodes a valid compressed state', () => {
    const state = { l: 'en', km: 20000, fp: 7.5 };
    const json = JSON.stringify(state);
    const compressed = LZString.compressToEncodedURIComponent(json);
    window.location.hash = '#' + compressed;

    const result = stateFromUrl();
    expect(result).toEqual(state);
  });
});

describe('round-trip', () => {
  it('preserves full state through encode/decode', () => {
    const state = {
      l: 'pl',
      c: 'PLN',
      s: 'eu-2020-740-c1',
      cl: ['C', 'E'],
      km: 15000,
      fp: 6.5,
      fc: 7,
      y: 5,
      fv: 10,
      tp: { C: 400, E: 300 },
      cc: { C: '#ff0000' },
      cr: { C: 8.2 },
    };

    stateToUrl(state);
    const hash = window.history.replaceState.mock.calls[0][2];
    window.location.hash = hash;

    const restored = stateFromUrl();
    expect(restored).toEqual(state);
  });
});

describe('getShareableUrl', () => {
  it('returns window.location.href', () => {
    window.location.href = 'http://example.com/#abc123';
    expect(getShareableUrl()).toBe('http://example.com/#abc123');
  });
});

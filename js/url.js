/**
 * Serialize app state to URL hash using LZString compression.
 */
function stateToUrl(state) {
  const json = JSON.stringify(state);
  const compressed = LZString.compressToEncodedURIComponent(json);
  window.history.replaceState(null, "", "#" + compressed);
}

/**
 * Deserialize app state from URL hash.
 * Returns null if no valid state found.
 */
function stateFromUrl() {
  const hash = window.location.hash.slice(1);
  if (!hash) return null;
  try {
    const json = LZString.decompressFromEncodedURIComponent(hash);
    if (!json) return null;
    return JSON.parse(json);
  } catch (e) {
    return null;
  }
}

/**
 * Build the full shareable URL string.
 */
function getShareableUrl() {
  return window.location.href;
}

// Allow importing in Node (tests) — no-op in browsers
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { stateToUrl, stateFromUrl, getShareableUrl };
}

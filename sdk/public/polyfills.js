/**
 * Browser Polyfills for Node.js Global Variables
 *
 * This file provides compatibility for Node.js modules used by @zama-fhe/relayer-sdk
 * when running in a browser environment.
 */

// Define global variable (used by many Node.js modules)
if (typeof window !== 'undefined') {
  window.global = window.globalThis || window;
}

// Define process.env (used by many Node.js modules)
if (typeof window !== 'undefined' && !window.process) {
  window.process = {
    env: {},
    version: '',
    versions: {},
    browser: true,
  };
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    global: globalThis,
    process: window.process,
  };
}

console.log('[Polyfills] Node.js compatibility layer loaded');

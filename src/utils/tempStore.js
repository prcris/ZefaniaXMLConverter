const crypto = require('crypto');
const fs = require('fs-extra');

// In-memory store: token -> { filePath, displayName, mime, expiresAt }
const store = new Map();

/**
 * Create a new temp entry and return token
 * @param {string} filePath - Absolute path to file on disk
 * @param {string} displayName - Suggested filename for download
 * @param {number} ttlMs - Time to live in ms
 * @param {string} mime - Content-Type
 * @returns {string} token
 */
function add(filePath, displayName, ttlMs = 2 * 60 * 60 * 1000, mime = 'application/xml') {
  const token = crypto.randomUUID();
  const expiresAt = Date.now() + ttlMs;
  store.set(token, { filePath, displayName, mime, expiresAt });
  return token;
}

/**
 * Get entry by token. Returns null if not found or expired.
 */
function get(token) {
  const entry = store.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    remove(token);
    return null;
  }
  return entry;
}

/**
 * Remove entry and delete underlying file (best-effort)
 */
function remove(token) {
  const entry = store.get(token);
  if (entry) {
    store.delete(token);
    fs.remove(entry.filePath).catch(() => {});
  }
}

/**
 * Sweep expired entries and delete files
 */
async function sweep() {
  const now = Date.now();
  for (const [token, entry] of store.entries()) {
    if (now > entry.expiresAt) {
      store.delete(token);
      try { await fs.remove(entry.filePath); } catch (_) {}
    }
  }
}

// Background sweeper every 10 minutes
setInterval(() => {
  sweep().catch(() => {});
}, 10 * 60 * 1000).unref?.();

module.exports = {
  add,
  get,
  remove,
  sweep
};

// src/services/api.js
// All communication with the Shadow Rift backend

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// ── Base fetch wrapper ─────────────────────────────────
async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers    : { 'Content-Type': 'application/json' },
      credentials: 'include',   // ← sends session cookie with every request
      ...options,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API error');
    return data;
  } catch (err) {
    console.warn(`API [${path}] failed:`, err.message);
    throw err;
  }
}

// ══════════════════════════════════════════════════════
//  SESSION  (Unit 5 — Express Session Management)
// ══════════════════════════════════════════════════════

/**
 * Login — creates a server-side session stored in MongoDB.
 * If user already has a session cookie, the server finds it
 * automatically without re-typing the username.
 */
export async function sessionLogin(username) {
  try {
    return await request('/api/session/login', {
      method: 'POST',
      body  : JSON.stringify({ username }),
    });
  } catch (err) {
    // Offline fallback: create guest profile
    console.warn('Backend unavailable, switching to offline mode');
    return {
      player: {
        username,
        stats       : {},
        achievements: [],
        rank        : { points: 0, tier: 'Bronze' },
      },
      isNew: true,
      offline: true,
    };
  }
}

/**
 * Check session — called on app load.
 * Returns { loggedIn: true, player } if session exists.
 * Returns { loggedIn: false } if not logged in.
 */
export async function checkSession() {
  try {
    return await request('/api/session/check');
  } catch (err) {
    // Offline mode: no session
    console.warn('Backend unavailable, skipping session check');
    return { loggedIn: false };
  }
}

/**
 * Logout — destroys the session on the server
 * and clears the cookie on the client.
 */
export async function sessionLogout() {
  try {
    return await request('/api/session/logout', { method: 'DELETE' });
  } catch (err) {
    // Offline: just clear locally
    console.warn('Backend unavailable, clearing local session');
    return { success: true };
  }
}

/**
 * Session info — shows raw session data (good for exam demo).
 */
export async function getSessionInfo() {
  try {
    return await request('/api/session/info');
  } catch (err) {
    return { offline: true };
  }
}

// ══════════════════════════════════════════════════════
//  PLAYERS
// ══════════════════════════════════════════════════════

export async function registerPlayer(username) {
  try {
    return await request('/api/players/register', {
      method: 'POST',
      body  : JSON.stringify({ username }),
    });
  } catch (err) {
    return { player: { username, stats: {}, achievements: [], rank: { points: 0, tier: 'Bronze' } } };
  }
}

export async function getPlayer(username) {
  try {
    return await request(`/api/players/${encodeURIComponent(username)}`);
  } catch (err) {
    return { player: { username, stats: {}, achievements: [], rank: { points: 0, tier: 'Bronze' } } };
  }
}

export async function getPlayerHistory(username, limit = 20) {
  try {
    return await request(`/api/players/${encodeURIComponent(username)}/history?limit=${limit}`);
  } catch (err) {
    return { history: [] };
  }
}

export async function getLeaderboard(limit = 20) {
  try {
    return await request(`/api/players/leaderboard/top?limit=${limit}`);
  } catch (err) {
    return { leaderboard: [] };
  }
}

// ══════════════════════════════════════════════════════
//  MATCHES
// ══════════════════════════════════════════════════════

export async function saveMatch(matchData) {
  try {
    return await request('/api/matches', {
      method: 'POST',
      body  : JSON.stringify(matchData),
    });
  } catch (err) {
    console.warn('Could not save match to database');
    return { success: false, offline: true };
  }
}

export async function getRecentMatches(limit = 10) {
  try {
    return await request(`/api/matches/recent?limit=${limit}`);
  } catch (err) {
    return { matches: [] };
  }
}

export async function getGlobalStats() {
  try {
    return await request('/api/matches/stats/global');
  } catch (err) {
    return { stats: {} };
  }
}

// ── Health ─────────────────────────────────────────────
// Available but not called in UI — useful for exam demo / testing
export async function checkHealth() {
  try {
    const data = await request('/api/health');
    return data.status === 'ok';
  } catch { return false; }
}

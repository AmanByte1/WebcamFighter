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
  return request('/api/session/login', {
    method: 'POST',
    body  : JSON.stringify({ username }),
  });
}

/**
 * Check session — called on app load.
 * Returns { loggedIn: true, player } if session exists.
 * Returns { loggedIn: false } if not logged in.
 */
export async function checkSession() {
  return request('/api/session/check');
}

/**
 * Logout — destroys the session on the server
 * and clears the cookie on the client.
 */
export async function sessionLogout() {
  return request('/api/session/logout', { method: 'DELETE' });
}

/**
 * Session info — shows raw session data (good for exam demo).
 */
export async function getSessionInfo() {
  return request('/api/session/info');
}

// ══════════════════════════════════════════════════════
//  PLAYERS
// ══════════════════════════════════════════════════════

export async function registerPlayer(username) {
  return request('/api/players/register', {
    method: 'POST',
    body  : JSON.stringify({ username }),
  });
}

export async function getPlayer(username) {
  return request(`/api/players/${encodeURIComponent(username)}`);
}

export async function getPlayerHistory(username, limit = 20) {
  return request(`/api/players/${encodeURIComponent(username)}/history?limit=${limit}`);
}

export async function getLeaderboard(limit = 20) {
  return request(`/api/players/leaderboard/top?limit=${limit}`);
}

// ══════════════════════════════════════════════════════
//  MATCHES
// ══════════════════════════════════════════════════════

export async function saveMatch(matchData) {
  return request('/api/matches', {
    method: 'POST',
    body  : JSON.stringify(matchData),
  });
}

export async function getRecentMatches(limit = 10) {
  return request(`/api/matches/recent?limit=${limit}`);
}

export async function getGlobalStats() {
  return request('/api/matches/stats/global');
}

// ── Health ─────────────────────────────────────────────
// Available but not called in UI — useful for exam demo / testing
export async function checkHealth() {
  try {
    const data = await request('/api/health');
    return data.status === 'ok';
  } catch { return false; }
}

// These are available for future features or exam demo purposes
export async function getSessionInfo()     { return request('/api/session/info'); }
export async function registerPlayer(u)    { return request('/api/players/register', { method:'POST', body: JSON.stringify({ username: u }) }); }
export async function getRecentMatches(n=10){ return request(`/api/matches/recent?limit=${n}`); }
export async function getGlobalStats()     { return request('/api/matches/stats/global'); }

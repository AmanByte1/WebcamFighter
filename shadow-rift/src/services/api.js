// src/services/api.js
// All communication with the Shadow Rift backend

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

async function request(path, options = {}) {
  try {
    const res = await fetch(`${BASE}${path}`, {
      headers: { 'Content-Type': 'application/json' },
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

// ── Players ────────────────────────────────────────────

/** Register or fetch a player by username */
export async function registerPlayer(username) {
  return request('/api/players/register', {
    method : 'POST',
    body   : JSON.stringify({ username }),
  });
}

/** Get a player's full profile */
export async function getPlayer(username) {
  return request(`/api/players/${encodeURIComponent(username)}`);
}

/** Get a player's recent match history */
export async function getPlayerHistory(username, limit = 20) {
  return request(`/api/players/${encodeURIComponent(username)}/history?limit=${limit}`);
}

/** Get the global leaderboard */
export async function getLeaderboard(limit = 20) {
  return request(`/api/players/leaderboard/top?limit=${limit}`);
}

// ── Matches ────────────────────────────────────────────

/**
 * Save a completed match.
 * @param {object} matchData - { username, result, playerRoundWins, aiRoundWins, rounds, stats, duration }
 */
export async function saveMatch(matchData) {
  return request('/api/matches', {
    method : 'POST',
    body   : JSON.stringify(matchData),
  });
}

/** Get recent matches across all players */
export async function getRecentMatches(limit = 10) {
  return request(`/api/matches/recent?limit=${limit}`);
}

/** Get global game statistics */
export async function getGlobalStats() {
  return request('/api/matches/stats/global');
}

/** Check if backend is reachable */
export async function checkHealth() {
  try {
    const data = await request('/api/health');
    return data.status === 'ok';
  } catch {
    return false;
  }
}

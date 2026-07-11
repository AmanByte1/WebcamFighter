// src/context/PlayerContext.jsx
// Global player state — uses express-session for persistence
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { sessionLogin, checkSession, sessionLogout, getPlayer } from '../services/api.js';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [player,      setPlayer]      = useState(null);
  const [loading,     setLoading]     = useState(true);   // true on first load while checking session
  const [error,       setError]       = useState(null);
  const [offline,     setOffline]     = useState(false);
  const [sessionInfo, setSessionInfo] = useState(null);

  // ── On app load: check if session already exists ───
  // This is the key feature — if user visited before,
  // their session cookie is sent automatically and they
  // skip the login screen entirely
  useEffect(() => {
    async function restoreSession() {
      try {
        const data = await checkSession();
        if (data.loggedIn && data.player) {
          setPlayer(data.player);
          setSessionInfo({ id: data.sessionId, loginTime: data.loginTime });
          console.log(`✅ Session restored for: ${data.username}`);
        }
      } catch (err) {
        // Backend offline — allow offline play
        console.warn('Backend offline — session check failed:', err.message);
        setOffline(true);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

  // ── Login — creates session on server ─────────────
  const login = useCallback(async (username) => {
    setLoading(true);
    setError(null);
    try {
      const data = await sessionLogin(username);
      setPlayer(data.player);
      setOffline(false);
      setSessionInfo({ loginTime: data.session?.loginTime });
      return { player: data.player, isNew: data.isNew };
    } catch (err) {
      // If backend is down, allow offline play with guest profile
      if (err.message.includes('fetch') || err.message.includes('Failed')) {
        setOffline(true);
        const guest = {
          username,
          stats       : {},
          achievements: [],
          rank        : { points: 0, tier: 'Bronze' },
        };
        setPlayer(guest);
        return { player: guest, isNew: true, offline: true };
      }
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Logout — destroys session on server ───────────
  const logout = useCallback(async () => {
    try {
      await sessionLogout();
    } catch (err) {
      console.warn('Logout error:', err.message);
    } finally {
      setPlayer(null);
      setSessionInfo(null);
      setOffline(false);
    }
  }, []);

  // ── Refresh player data from DB ────────────────────
  const refreshPlayer = useCallback(async () => {
    if (!player?.username || offline) return;
    try {
      const data = await getPlayer(player.username);
      setPlayer(data.player);
    } catch { /* silent */ }
  }, [player, offline]);

  // ── Update player locally (deep merge) ───────────────
  const updatePlayerLocally = useCallback((updates) => {
    setPlayer(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        ...updates,
        // Deep merge stats so individual fields don't get wiped
        stats: { ...(prev.stats || {}), ...(updates.stats || {}) },
        rank : { ...(prev.rank  || {}), ...(updates.rank  || {}) },
      };
    });
  }, []);

  return (
    <PlayerContext.Provider value={{
      player, loading, error, offline, sessionInfo,
      login, logout, refreshPlayer, updatePlayerLocally,
      isLoggedIn: !!player,
    }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used inside PlayerProvider');
  return ctx;
}

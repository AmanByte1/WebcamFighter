// src/context/PlayerContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';
import { registerPlayer, getPlayer } from '../services/api.js';

const PlayerContext = createContext(null);

export function PlayerProvider({ children }) {
  const [player,    setPlayer]    = useState(null);   // full player object
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);
  const [offline,   setOffline]   = useState(false);  // true if backend unreachable

  const login = useCallback(async (username) => {
    setLoading(true);
    setError(null);
    try {
      const { player: p, isNew } = await registerPlayer(username);
      setPlayer(p);
      setOffline(false);
      return { player: p, isNew };
    } catch (err) {
      // If backend is down, allow offline play
      if (err.message.includes('fetch') || err.message.includes('Failed')) {
        setOffline(true);
        const guestPlayer = { username, stats: {}, achievements: [], rank: { points: 0, tier: 'Bronze' } };
        setPlayer(guestPlayer);
        return { player: guestPlayer, isNew: true, offline: true };
      }
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshPlayer = useCallback(async () => {
    if (!player?.username || offline) return;
    try {
      const { player: p } = await getPlayer(player.username);
      setPlayer(p);
    } catch { /* silent */ }
  }, [player, offline]);

  const updatePlayerLocally = useCallback((updates) => {
    setPlayer(prev => prev ? { ...prev, ...updates } : prev);
  }, []);

  return (
    <PlayerContext.Provider value={{
      player, loading, error, offline,
      login, refreshPlayer, updatePlayerLocally,
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

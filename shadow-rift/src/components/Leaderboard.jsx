// src/components/Leaderboard.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getLeaderboard } from '../services/api.js';
import '../styles/db-screens.css';

const TIER_COLORS = {
  Diamond : '#00c8ff',
  Platinum: '#e5e4e2',
  Gold    : '#ffd700',
  Silver  : '#c0c0c0',
  Bronze  : '#cd7f32',
};
const TIER_ICONS = {
  Diamond:'💎', Platinum:'🏆', Gold:'🥇', Silver:'🥈', Bronze:'🥉',
};

export function Leaderboard({ currentUsername, onClose }) {
  const [board,       setBoard]       = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // ── Fetch leaderboard data ─────────────────────────
  // Empty deps [] — stable function, never recreates
  const fetchBoard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setRefreshing(true);
    try {
      const data = await getLeaderboard(20);
      setBoard(data.leaderboard || []);
      setLastUpdated(new Date());
      setError(null);
    } catch {
      setError('Could not load leaderboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []); // ← empty deps — no external values used inside

  // ── Fetch on open ──────────────────────────────────
  useEffect(() => {
    fetchBoard(false);
  }, [fetchBoard]);

  // ── Auto-refresh every 10 seconds ─────────────────
  useEffect(() => {
    const interval = setInterval(() => fetchBoard(true), 10000);
    return () => clearInterval(interval);
  }, [fetchBoard]);

  // Find current user's rank
  const myRank = board.find(p => p.username === currentUsername);

  return (
    <div className="db-screen">
      <div className="db-panel">

        {/* Header */}
        <div className="db-header">
          <h1 className="db-title">🏆 Leaderboard</h1>
          <div style={{ display:'flex', alignItems:'center', gap:'.8rem' }}>
            <button
              className="refresh-btn"
              onClick={() => fetchBoard(false)}
              disabled={refreshing}
              title="Refresh"
            >
              {refreshing ? '⟳' : '↻'}
            </button>
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Live indicator */}
        <div className="live-indicator">
          <span className="live-dot" />
          LIVE
          {lastUpdated && (
            <span style={{ color:'rgba(255,255,255,0.25)',
                           marginLeft:'.5rem', fontSize:'.6rem' }}>
              · Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <span style={{ color:'rgba(255,255,255,0.2)',
                         marginLeft:'.5rem', fontSize:'.6rem' }}>
            · Auto-refreshes every 10s
          </span>
        </div>

        {/* Your rank callout */}
        {myRank && (
          <div style={{
            background : 'rgba(0,200,255,0.07)',
            border     : '1px solid rgba(0,200,255,0.2)',
            borderRadius: '8px',
            padding    : '.6rem 1rem',
            marginBottom: '1rem',
            fontSize   : '.82rem',
            display    : 'flex',
            gap        : '1.2rem',
            flexWrap   : 'wrap',
          }}>
            <span style={{ color:'#00c8ff', fontWeight:700 }}>
              You — #{myRank.rank}
            </span>
            <span style={{ color:TIER_COLORS[myRank.tier] }}>
              {TIER_ICONS[myRank.tier]} {myRank.tier}
            </span>
            <span style={{ color:'#ffd700' }}>{myRank.points} pts</span>
            <span style={{ color:'#fff6' }}>
              {myRank.wins}W / {myRank.losses}L · {myRank.winRate}%
            </span>
          </div>
        )}

        {loading && <div className="db-loading">Loading…</div>}
        {error   && <div className="db-error">{error}</div>}

        {!loading && !error && (
          <div className="lb-table-wrap">
            <table className="lb-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th>Tier</th>
                  <th>Points</th>
                  <th>W</th>
                  <th>L</th>
                  <th>Win%</th>
                  <th>Streak</th>
                </tr>
              </thead>
              <tbody>
                {board.map(p => {
                  const isMe = p.username === currentUsername;
                  return (
                    <tr key={p.username} className={isMe ? 'lb-me' : ''}>
                      <td className="lb-rank">
                        {p.rank <= 3
                          ? ['🥇','🥈','🥉'][p.rank - 1]
                          : p.rank}
                      </td>
                      <td className="lb-name">
                        {p.username}
                        {isMe && <span className="lb-you"> ← you</span>}
                      </td>
                      <td style={{ color: TIER_COLORS[p.tier] }}>
                        {TIER_ICONS[p.tier]} {p.tier}
                      </td>
                      <td className="lb-pts">{p.points}</td>
                      <td style={{ color:'#00c8ff' }}>{p.wins}</td>
                      <td style={{ color:'#ff2d55' }}>{p.losses}</td>
                      <td>{p.winRate}%</td>
                      <td>
                        {p.winStreak > 0
                          ? <span style={{ color:'#ff6600' }}>🔥{p.winStreak}</span>
                          : p.winStreak}
                      </td>
                    </tr>
                  );
                })}
                {board.length === 0 && (
                  <tr>
                    <td colSpan="8" className="lb-empty">
                      No players yet — be the first!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}

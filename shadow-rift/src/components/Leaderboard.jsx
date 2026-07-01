// src/components/Leaderboard.jsx
import React, { useEffect, useState } from 'react';
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
  const [board,   setBoard]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    getLeaderboard(20)
      .then(d => setBoard(d.leaderboard || []))
      .catch(() => setError('Could not load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="db-screen">
      <div className="db-panel">
        <div className="db-header">
          <h1 className="db-title">🏆 Leaderboard</h1>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

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
                        {isMe && <span className="lb-you"> (you)</span>}
                      </td>
                      <td style={{ color: TIER_COLORS[p.tier] }}>
                        {TIER_ICONS[p.tier]} {p.tier}
                      </td>
                      <td className="lb-pts">{p.points}</td>
                      <td style={{ color: '#00c8ff' }}>{p.wins}</td>
                      <td style={{ color: '#ff2d55' }}>{p.losses}</td>
                      <td>{p.winRate}%</td>
                      <td>{p.winStreak > 0 ? `🔥${p.winStreak}` : p.winStreak}</td>
                    </tr>
                  );
                })}
                {board.length === 0 && (
                  <tr><td colSpan="8" className="lb-empty">No players yet — be the first!</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

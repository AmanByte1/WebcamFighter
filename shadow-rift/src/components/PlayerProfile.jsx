// src/components/PlayerProfile.jsx
import React, { useEffect, useState } from 'react';
import { getPlayerHistory } from '../services/api.js';
import '../styles/db-screens.css';

const TIER_COLORS = { Diamond:'#00c8ff', Platinum:'#e5e4e2', Gold:'#ffd700', Silver:'#c0c0c0', Bronze:'#cd7f32' };

function StatBox({ label, value, color }) {
  return (
    <div className="stat-box">
      <div className="stat-val" style={{ color: color || '#fff' }}>{value}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

function MatchRow({ match }) {
  const color  = match.result === 'win' ? '#00c8ff' : match.result === 'loss' ? '#ff2d55' : '#ffd700';
  const label  = match.result === 'win' ? 'WIN' : match.result === 'loss' ? 'LOSS' : 'DRAW';
  const date   = new Date(match.createdAt).toLocaleDateString();
  const score  = `${match.playerRoundWins}-${match.aiRoundWins}`;

  return (
    <div className="match-row">
      <span className="match-result" style={{ color }}>{label}</span>
      <span className="match-score">{score}</span>
      <span className="match-combo">Best combo: {match.stats?.bestCombo || 0}</span>
      <span className="match-pts">
        {match.pointsAfter - match.pointsBefore >= 0 ? '+' : ''}
        {match.pointsAfter - match.pointsBefore} pts
      </span>
      <span className="match-date">{date}</span>
    </div>
  );
}

export function PlayerProfile({ player, onClose }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPlayerHistory(player.username, 15)
      .then(d => setHistory(d.matches || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [player.username]);

  const s    = player.stats  || {};
  const rank = player.rank   || {};
  const wr   = player.winRate ?? (s.totalMatches > 0 ? Math.round(s.wins / s.totalMatches * 100) : 0);

  return (
    <div className="db-screen">
      <div className="db-panel profile-panel">
        <div className="db-header">
          <h1 className="db-title">👤 {player.username}</h1>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>

        {/* Rank badge */}
        <div className="rank-badge" style={{ borderColor: TIER_COLORS[rank.tier] || '#fff' }}>
          <span style={{ color: TIER_COLORS[rank.tier] }}>{rank.tier || 'Bronze'}</span>
          <span className="rank-pts">{rank.points || 0} pts</span>
        </div>

        {/* Stats grid */}
        <div className="stats-grid">
          <StatBox label="Wins"        value={s.wins        || 0} color="#00c8ff" />
          <StatBox label="Losses"      value={s.losses      || 0} color="#ff2d55" />
          <StatBox label="Draws"       value={s.draws       || 0} color="#ffd700" />
          <StatBox label="Win Rate"    value={`${wr}%`}           color="#00ff88" />
          <StatBox label="Best Combo"  value={s.bestCombo   || 0} color="#ffd700" />
          <StatBox label="Win Streak"  value={s.bestWinStreak||0} color="#ff6600" />
          <StatBox label="KOs"         value={s.knockouts   || 0} color="#ff2d55" />
          <StatBox label="Super Moves" value={s.superMoves  || 0} color="#aa00ff" />
        </div>

        {/* Achievements */}
        {player.achievements?.length > 0 && (
          <div className="ach-section">
            <h3 className="section-title">Achievements ({player.achievements.length})</h3>
            <div className="ach-grid">
              {player.achievements.map(a => (
                <div key={a.id} className="ach-badge" title={a.description}>
                  <span className="ach-icon">{a.icon}</span>
                  <span className="ach-name">{a.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Match history */}
        <div className="history-section">
          <h3 className="section-title">Recent Matches</h3>
          {loading && <div className="db-loading">Loading…</div>}
          {!loading && history.length === 0 && (
            <div className="lb-empty">No matches yet</div>
          )}
          {!loading && history.map(m => <MatchRow key={m._id} match={m} />)}
        </div>
      </div>
    </div>
  );
}

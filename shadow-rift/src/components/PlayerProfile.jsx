// src/components/PlayerProfile.jsx
import React, { useEffect, useState, useCallback } from 'react';
import { getPlayer, getPlayerHistory } from '../services/api.js';
import { usePlayer } from '../context/PlayerContext.jsx';
import '../styles/db-screens.css';

const TIER_COLORS = {
  Diamond : '#00c8ff',
  Platinum: '#e5e4e2',
  Gold    : '#ffd700',
  Silver  : '#c0c0c0',
  Bronze  : '#cd7f32',
};

// ── Stat box ───────────────────────────────────────────
function StatBox({ label, value, color, prev }) {
  // Show green flash if value increased since last fetch
  const changed = prev !== undefined && value !== prev && value > prev;
  return (
    <div className="stat-box" style={ changed ? { borderColor:'#00ff88' } : {} }>
      <div className="stat-val" style={{ color: color || '#fff' }}>
        {value}
        {changed && (
          <span style={{ fontSize:'.55rem', color:'#00ff88',
                         marginLeft:'.3rem', verticalAlign:'middle' }}>
            ▲
          </span>
        )}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

// ── Match row ──────────────────────────────────────────
function MatchRow({ match }) {
  const color = match.result==='win' ? '#00c8ff'
              : match.result==='loss'? '#ff2d55' : '#ffd700';
  const label = match.result==='win' ? 'WIN'
              : match.result==='loss'? 'LOSS' : 'DRAW';
  const score = `${match.playerRoundWins}-${match.aiRoundWins}`;
  const delta = (match.pointsAfter || 0) - (match.pointsBefore || 0);
  const date  = new Date(match.createdAt).toLocaleDateString();
  const time  = new Date(match.createdAt).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });

  return (
    <div className="match-row">
      <span className="match-result" style={{ color }}>{label}</span>
      <span className="match-score">{score}</span>
      <span className="match-combo">Combo: {match.stats?.bestCombo || 0}</span>
      <span className="match-pts" style={{ color: delta >= 0 ? '#00ff88' : '#ff2d55' }}>
        {delta >= 0 ? '+' : ''}{delta} pts
      </span>
      <span className="match-date">{date} {time}</span>
    </div>
  );
}

// ── Main component ─────────────────────────────────────
export function PlayerProfile({ onClose }) {
  const { player: ctxPlayer, updatePlayerLocally } = usePlayer();

  // Fresh data fetched directly from DB
  const [freshPlayer, setFreshPlayer] = useState(null);
  const [prevStats,   setPrevStats]   = useState(null); // for change indicators
  const [history,     setHistory]     = useState([]);
  const [loadingData, setLoadingData] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [refreshing,  setRefreshing]  = useState(false);

  // ── Fetch fresh data from DB ───────────────────────
  const fetchFresh = useCallback(async (silent = false) => {
    if (!ctxPlayer?.username) return;
    if (!silent) setLoadingData(true);
    setRefreshing(true);

    try {
      // Fetch player stats and match history in parallel
      const [playerRes, historyRes] = await Promise.all([
        getPlayer(ctxPlayer.username),
        getPlayerHistory(ctxPlayer.username, 15),
      ]);

      // Save previous stats so we can show change indicators
      setFreshPlayer(prev => {
        if (prev) setPrevStats(prev.stats);
        return playerRes.player;
      });

      setHistory(historyRes.matches || []);
      setLastUpdated(new Date());

      // Also update PlayerContext so HUD/title reflects new data
      updatePlayerLocally(playerRes.player);

    } catch (err) {
      console.warn('Profile refresh failed:', err.message);
    } finally {
      setLoadingData(false);
      setRefreshing(false);
    }
  }, [ctxPlayer?.username, updatePlayerLocally]);

  // ── Fetch on mount (when profile opens) ───────────
  useEffect(() => {
    fetchFresh(false);
  }, [fetchFresh]);

  // ── Auto-refresh every 5 seconds while open ────────
  useEffect(() => {
    const interval = setInterval(() => {
      fetchFresh(true); // silent = true → no loading spinner
    }, 5000);

    return () => clearInterval(interval); // cleanup on close
  }, [fetchFresh]);

  // Use fresh data if available, fall back to context player
  const player = freshPlayer || ctxPlayer;
  const s      = player?.stats || {};
  const rank   = player?.rank  || {};
  const ps     = prevStats     || {};
  const wr     = s.totalMatches > 0
                   ? Math.round((s.wins / s.totalMatches) * 100)
                   : 0;

  return (
    <div className="db-screen">
      <div className="db-panel profile-panel">

        {/* Header */}
        <div className="db-header">
          <h1 className="db-title">👤 {player?.username}</h1>
          <div style={{ display:'flex', alignItems:'center', gap:'.8rem' }}>
            {/* Manual refresh button */}
            <button
              className="refresh-btn"
              onClick={() => fetchFresh(false)}
              disabled={refreshing}
              title="Refresh now"
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
            <span style={{ color:'rgba(255,255,255,0.25)', marginLeft:'.5rem', fontSize:'.6rem' }}>
              · Updated {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <span style={{ color:'rgba(255,255,255,0.2)', marginLeft:'.5rem', fontSize:'.6rem' }}>
            · Auto-refreshes every 5s
          </span>
        </div>

        {/* Loading state */}
        {loadingData && !freshPlayer && (
          <div className="db-loading">Fetching latest data…</div>
        )}

        {player && (
          <>
            {/* Rank badge */}
            <div className="rank-badge"
              style={{ borderColor: TIER_COLORS[rank.tier] || '#fff' }}>
              <span style={{ color: TIER_COLORS[rank.tier] }}>
                {rank.tier || 'Bronze'}
              </span>
              <span className="rank-pts">{rank.points || 0} pts</span>
            </div>

            {/* Stats grid — shows ▲ when value changed */}
            <div className="stats-grid">
              <StatBox label="Wins"        value={s.wins          ||0} prev={ps.wins}          color="#00c8ff"/>
              <StatBox label="Losses"      value={s.losses        ||0} prev={ps.losses}        color="#ff2d55"/>
              <StatBox label="Draws"       value={s.draws         ||0} prev={ps.draws}         color="#ffd700"/>
              <StatBox label="Win Rate"    value={`${wr}%`}             prev={`${wr}%`}         color="#00ff88"/>
              <StatBox label="Best Combo"  value={s.bestCombo     ||0} prev={ps.bestCombo}     color="#ffd700"/>
              <StatBox label="Win Streak"  value={s.bestWinStreak ||0} prev={ps.bestWinStreak} color="#ff6600"/>
              <StatBox label="KOs"         value={s.knockouts     ||0} prev={ps.knockouts}     color="#ff2d55"/>
              <StatBox label="Super Moves" value={s.superMoves    ||0} prev={ps.superMoves}    color="#aa00ff"/>
            </div>

            {/* Achievements */}
            {player.achievements?.length > 0 && (
              <div className="ach-section">
                <h3 className="section-title">
                  Achievements ({player.achievements.length})
                </h3>
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
              <h3 className="section-title">
                Recent Matches
                {refreshing && (
                  <span style={{ color:'rgba(255,255,255,0.25)',
                                 fontSize:'.6rem', marginLeft:'.5rem' }}>
                    refreshing…
                  </span>
                )}
              </h3>
              {!loadingData && history.length === 0 && (
                <div className="lb-empty">No matches yet — go fight!</div>
              )}
              {history.map(m => <MatchRow key={m._id} match={m} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// src/components/MatchResultScreen.jsx
import React from 'react';
import '../styles/db-screens.css';

export function MatchResultScreen({ result, matchSave, onPlayAgain, onLeaderboard, onProfile }) {
  const { playerWins, aiWins } = result;
  const playerWon = playerWins > aiWins;
  const isDraw    = playerWins === aiWins;

  const title = playerWon ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEATED';
  const color = playerWon ? '#00c8ff'  : isDraw ? '#ffd700' : '#ff2d55';

  const delta = matchSave ? matchSave.pointsAfter - matchSave.pointsBefore : 0;
  const newAch= matchSave?.newAchievements || [];

  return (
    <div className="db-screen result-screen">
      <div className="result-title" style={{ color, textShadow: `0 0 40px ${color}` }}>
        {title}
      </div>
      <div className="result-score">
        {playerWins} — {aiWins}
      </div>

      {/* Points change */}
      {matchSave && (
        <div className="result-pts">
          <span style={{ color: delta >= 0 ? '#00ff88' : '#ff2d55' }}>
            {delta >= 0 ? '+' : ''}{delta} pts
          </span>
          <span className="result-tier"> → {matchSave.newTier}</span>
        </div>
      )}

      {/* New achievements */}
      {newAch.length > 0 && (
        <div className="new-ach-section">
          <div className="new-ach-title">🎉 Achievement Unlocked!</div>
          {newAch.map(a => (
            <div key={a.id} className="new-ach-item">
              {a.icon} <strong>{a.name}</strong> — {a.description}
            </div>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="result-actions">
        <button className="neon-btn" onClick={onPlayAgain}>Play Again</button>
        <button className="outline-btn" onClick={onLeaderboard}>Leaderboard</button>
        <button className="outline-btn" onClick={onProfile}>My Profile</button>
      </div>
    </div>
  );
}

// src/components/GameOverScreen.jsx
import React from 'react';
import '../styles/screens.css';

export function GameOverScreen({ playerWins, aiWins, onRetry }) {
  const playerWon = playerWins > aiWins;
  const isDraw    = playerWins === aiWins;

  const title = playerWon ? 'VICTORY' : isDraw ? 'DRAW' : 'DEFEATED';
  const sub   = playerWon
    ? 'Shadow has been defeated'
    : isDraw
    ? 'Neither fighter prevails'
    : 'Darkness prevails…';
  const color = playerWon ? '#00c8ff' : isDraw ? '#ffd700' : '#ff2d55';

  return (
    <div className="screen gameover-screen">
      <div className="gameover-title" style={{ color, textShadow: `0 0 40px ${color}` }}>
        {title}
      </div>
      <div className="gameover-sub">{sub}</div>
      <button className="neon-btn" onClick={onRetry}>Play Again</button>
    </div>
  );
}

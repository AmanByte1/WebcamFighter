// src/components/TitleScreen.jsx
import React from 'react';
import '../styles/screens.css';

export function TitleScreen({ onStart, onLeaderboard, onProfile, playerName, offline }) {
  return (
    <div className="screen title-screen">
      <div className="title-logo">Shadow Rift</div>
      <div className="title-sub">Webcam Fighter Pro</div>

      {playerName && (
        <div className="title-player">
          Welcome back, <span style={{ color:'#00c8ff' }}>{playerName}</span>
          {offline && <span style={{ color:'#ff6600', fontSize:'.75rem', marginLeft:'.5rem' }}>(offline)</span>}
        </div>
      )}

      <button className="neon-btn" onClick={onStart} style={{ marginTop:'1.2rem' }}>
        Fight Now
      </button>

      <div className="title-nav">
        <button className="nav-btn" onClick={onLeaderboard}>🏆 Leaderboard</button>
        <button className="nav-btn" onClick={onProfile}>👤 My Profile</button>
      </div>

      <p className="title-hint">
        Move your body to fight · Punch · Block · Kick<br/>
        Or use the on-screen buttons
      </p>
    </div>
  );
}

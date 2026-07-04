// src/components/TitleScreen.jsx
import React from 'react';
import { usePlayer } from '../context/PlayerContext.jsx';
import '../styles/screens.css';

export function TitleScreen({ onStart, onLeaderboard, onProfile, onLogout }) {
  const { player, offline, sessionInfo } = usePlayer();

  return (
    <div className="screen title-screen">

      <div className="title-logo">Shadow Rift</div>
      <div className="title-sub">Webcam Fighter Pro</div>

      {/* Player welcome + session info */}
      {player?.username && (
        <div className="title-welcome">
          <span style={{ color:'rgba(255,255,255,0.45)', fontSize:'.8rem' }}>
            Logged in as&nbsp;
          </span>
          <span style={{ color:'#00c8ff', fontWeight:700 }}>
            {player.username}
          </span>
          {offline && (
            <span style={{ color:'#ff6600', fontSize:'.7rem', marginLeft:'.5rem' }}>
              (offline)
            </span>
          )}
          {/* Show rank tier */}
          {player.rank?.tier && (
            <span style={{ color:'#ffd700', fontSize:'.75rem', marginLeft:'.6rem' }}>
              · {player.rank.tier}
            </span>
          )}
        </div>
      )}

      {/* Main fight button */}
      <button className="neon-btn" onClick={onStart} style={{ marginTop:'1rem' }}>
        ⚔ Fight Now
      </button>

      {/* Nav buttons */}
      <div className="title-nav">
        <button className="nav-btn" onClick={onLeaderboard}>🏆 Leaderboard</button>
        <button className="nav-btn" onClick={onProfile}>👤 My Profile</button>
        <button className="nav-btn" onClick={onLogout}
          style={{ borderColor:'rgba(255,45,85,0.3)', color:'rgba(255,45,85,0.7)' }}>
          🚪 Logout
        </button>
      </div>

      <p className="title-hint">
        Move your body to fight · Punch · Block · Kick<br/>
        Use on-screen buttons if no webcam
      </p>

      {/* Session debug info — great for exam demo */}
      {sessionInfo?.loginTime && (
        <div style={{ marginTop:'1.5rem', color:'rgba(255,255,255,0.12)',
                      fontSize:'.6rem', letterSpacing:'.1em', textAlign:'center' }}>
          SESSION ACTIVE · LOGGED IN {new Date(sessionInfo.loginTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
}

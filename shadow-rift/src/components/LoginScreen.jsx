// src/components/LoginScreen.jsx
import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext.jsx';
import '../styles/screens.css';
import '../styles/db-screens.css';

export function LoginScreen({ onLogin }) {
  const { login, loading, error, offline } = usePlayer();
  const [username, setUsername] = useState('');
  const [localErr, setLocalErr] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalErr('');
    const clean = username.trim();

    // Client-side validation
    if (clean.length < 2)  { setLocalErr('At least 2 characters needed'); return; }
    if (clean.length > 16) { setLocalErr('Maximum 16 characters');         return; }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) {
      setLocalErr('Only letters, numbers and _ allowed');
      return;
    }

    try {
      const result = await login(clean);
      onLogin(result);
    } catch (err) {
      setLocalErr(err.message || 'Could not connect — try again');
    }
  }

  return (
    <div className="screen login-screen">
      <div className="login-box">

        {/* Logo */}
        <div className="title-logo" style={{ fontSize:'clamp(1.8rem,5vw,3.5rem)', marginBottom:'.3rem' }}>
          Shadow Rift
        </div>
        <div className="title-sub" style={{ marginBottom:'2rem' }}>
          Enter Your Fighter Name
        </div>

        {/* Offline warning */}
        {offline && (
          <div style={{ color:'#ff6600', fontSize:'.8rem', marginBottom:'1rem',
                        background:'rgba(255,100,0,.1)', border:'1px solid rgba(255,100,0,.3)',
                        borderRadius:'6px', padding:'.5rem 1rem', textAlign:'center' }}>
            ⚠ Backend offline — playing without saving stats
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <input
            className="name-input"
            type="text"
            placeholder="Your fighter name…"
            value={username}
            onChange={e => setUsername(e.target.value)}
            maxLength={16}
            autoFocus
            autoComplete="off"
            spellCheck={false}
            disabled={loading}
          />

          {/* Error message */}
          {(localErr || error) && (
            <div className="login-error">{localErr || error}</div>
          )}

          <button className="neon-btn" type="submit" disabled={loading}>
            {loading ? 'Connecting…' : 'Enter the Arena'}
          </button>

          <p className="login-hint">
            Letters, numbers and _ only · 2–16 chars<br/>
            Your progress is saved automatically
          </p>
        </form>

        {/* Session info for exam demo */}
        <div style={{ marginTop:'2rem', color:'rgba(255,255,255,0.15)',
                      fontSize:'.65rem', letterSpacing:'.08em', textAlign:'center' }}>
          SESSION STORED IN MONGODB · COOKIES LAST 7 DAYS
        </div>

      </div>
    </div>
  );
}

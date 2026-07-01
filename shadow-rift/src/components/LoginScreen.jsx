// src/components/LoginScreen.jsx
import React, { useState } from 'react';
import { usePlayer } from '../context/PlayerContext.jsx';
import '../styles/screens.css';

export function LoginScreen({ onLogin }) {
  const { login, loading, error } = usePlayer();
  const [username, setUsername]   = useState('');
  const [localErr, setLocalErr]   = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setLocalErr('');
    const clean = username.trim();
    if (clean.length < 2) { setLocalErr('At least 2 characters'); return; }
    if (clean.length > 16){ setLocalErr('Max 16 characters');      return; }
    if (!/^[a-zA-Z0-9_]+$/.test(clean)) { setLocalErr('Only letters, numbers, _'); return; }

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
        <div className="title-logo" style={{ fontSize: 'clamp(1.8rem,5vw,3.5rem)', marginBottom: '0.2rem' }}>
          Shadow Rift
        </div>
        <div className="title-sub" style={{ marginBottom: '2rem' }}>Enter your name to begin</div>

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
          />

          {(localErr || error) && (
            <div className="login-error">{localErr || error}</div>
          )}

          <button className="neon-btn" type="submit" disabled={loading}>
            {loading ? 'Connecting…' : 'Enter the Arena'}
          </button>

          <p className="login-hint">
            Letters, numbers and _ only · 2–16 chars
          </p>
        </form>
      </div>
    </div>
  );
}

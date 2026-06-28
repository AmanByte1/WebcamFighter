// src/components/TitleScreen.jsx
import React from 'react';
import '../styles/screens.css';

export function TitleScreen({ onStart }) {
  return (
    <div className="screen title-screen">
      <div className="title-logo">Shadow Rift</div>
      <div className="title-sub">Webcam Fighter Pro</div>
      <button className="neon-btn" onClick={onStart}>
        Engage Camera
      </button>
      <p className="title-hint">
        Move your body to fight · Punch · Block · Kick<br />
        Or use the on-screen buttons below
      </p>
    </div>
  );
}

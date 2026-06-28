// src/components/CalibrationOverlay.jsx
import React from 'react';

export function CalibrationOverlay({ countdown }) {
  return (
    <div className="calib-overlay">
      <h2>Stand Facing Camera</h2>
      <div className="calib-countdown">{countdown}</div>
      <p>Full upper body visible · Arms relaxed at sides</p>
    </div>
  );
}

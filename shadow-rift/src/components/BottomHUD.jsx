// src/components/BottomHUD.jsx
import React from 'react';

export function BottomHUD({ poseStatus, poseAction, pipVideoRef }) {
  return (
    <div className="bottom-hud">
      <div>
        <div className="pose-status">{poseStatus}</div>
        <div className="pose-action">{poseAction}</div>
      </div>

      <div className="pip-cam">
        <video
          id="pip-video"
          ref={pipVideoRef}
          autoPlay
          playsInline
          muted
          className="pip-video"
        />
        <div className="pip-label">LIVE</div>
      </div>
    </div>
  );
}

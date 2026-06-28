// src/components/HUD.jsx
import React from 'react';

function PowerPips({ count, max }) {
  return (
    <div className="power-row">
      {Array.from({ length: max }, (_, i) => (
        <div key={i} className={`power-pip${i < count ? ' active' : ''}`} />
      ))}
    </div>
  );
}

export function HUD({ playerHp, playerPower, aiHp, aiPower, timer, round }) {
  const timerUrgent = timer <= 10;

  return (
    <div className="hud">
      {/* Player */}
      <div className="fighter-hud left">
        <div className="fighter-name">YOU — KAI</div>
        <div className="health-track">
          <div className="health-bar" style={{ width: `${playerHp}%` }} />
        </div>
        <PowerPips count={playerPower} max={5} />
      </div>

      {/* Centre */}
      <div className="centre-hud">
        <div className="round-label">Round {round}</div>
        <div className={`timer${timerUrgent ? ' urgent' : ''}`}>{timer}</div>
      </div>

      {/* AI */}
      <div className="fighter-hud right">
        <div className="fighter-name">SHADOW — AI</div>
        <div className="health-track">
          <div className="health-bar" style={{ width: `${aiHp}%` }} />
        </div>
        <PowerPips count={aiPower} max={5} />
      </div>
    </div>
  );
}

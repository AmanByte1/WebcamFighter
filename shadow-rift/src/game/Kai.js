// ─────────────────────────────────────────────────────────
//  game/Kai.js  —  Player character
// ─────────────────────────────────────────────────────────
import { Fighter, roundRect } from './Fighter.js';

export class Kai extends Fighter {
  drawBody(ctx) {
    const t  = this.aTime;
    const st = this.state;
    const bob = st === 'idle' ? Math.sin(t * 3) * 4 : 0;

    let aE = 0, lE = 0, bL = 0;
    if (st === 'attack') {
      const p = Math.min(1, t / 0.28);
      aE = Math.sin(p * Math.PI) * 65;
      lE = Math.sin(p * Math.PI) * 22;
      bL = Math.sin(p * Math.PI) * 14;
    }
    if (st === 'special') { aE = 88;  lE = 30; bL = 22; }
    if (st === 'block')   { aE = -25; bL = -12; }
    if (st === 'hurt')    { bL = 28;  aE = -12; }
    if (st === 'victory') { aE = -45; lE = -10; }

    ctx.save();
    ctx.translate(bL, bob - 200);

    // ── Torso ──
    const tg = ctx.createLinearGradient(-26, -55, 26, 55);
    tg.addColorStop(0, '#1e6ab8'); tg.addColorStop(1, '#0d2f6a');
    roundRect(ctx, -23, -55, 46, 85, 9, tg);

    const cg = ctx.createLinearGradient(-16, -44, 16, 12);
    cg.addColorStop(0, '#2e8fe4'); cg.addColorStop(1, '#1a6ab8');
    roundRect(ctx, -16, -44, 32, 50, 6, cg);

    // Chest gem
    ctx.fillStyle  = '#00c8ff';
    ctx.shadowBlur = 14; ctx.shadowColor = '#00c8ff';
    ctx.beginPath(); ctx.arc(0, -22, 7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    // Belt
    roundRect(ctx, -23, 26, 46, 10, 3, '#0a1e4a');

    // ── Head ──
    ctx.save(); ctx.translate(0, -80);

    // Spiky anime hair
    ctx.fillStyle = '#121230';
    [[0,-58],[18,-50],[-18,-50],[26,-40],[-26,-40],[10,-60],[-10,-60],[20,-44],[-20,-44]].forEach(([sx,sy]) => {
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx - 9, sy + 22);
      ctx.lineTo(sx + 9, sy + 22);
      ctx.closePath();
      ctx.fill();
    });

    // Face
    const fg = ctx.createLinearGradient(-20, -38, 20, 18);
    fg.addColorStop(0, '#f7cba8'); fg.addColorStop(1, '#e29060');
    roundRect(ctx, -20, -38, 40, 56, 9, fg);

    // Glowing cyan eyes
    ctx.fillStyle  = '#00c8ff';
    ctx.shadowBlur = 10; ctx.shadowColor = '#00c8ff';
    ctx.beginPath(); ctx.ellipse(-8, -17, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 8, -17, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle  = 'rgba(0,0,0,0.65)';
    ctx.beginPath(); ctx.arc(-8, -17, 2.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc( 8, -17, 2.5, 0, Math.PI * 2); ctx.fill();

    // Mouth
    ctx.strokeStyle = '#a06540'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-5, -2); ctx.lineTo(5, -2); ctx.stroke();

    // Headband
    ctx.fillStyle  = '#ff2d55';
    ctx.shadowBlur = 5; ctx.shadowColor = '#ff2d55';
    roundRect(ctx, -22, -28, 44, 7, 2, '#ff2d55');
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Right arm ──
    ctx.save();
    ctx.translate(24, -24);
    ctx.rotate((-32 + aE) * Math.PI / 180);
    roundRect(ctx, -7, 0, 14, 38, 5, '#1e6ab8');
    ctx.translate(0, 40);
    ctx.rotate((-18 + aE * 0.4) * Math.PI / 180);
    roundRect(ctx, -6, 0, 12, 32, 5, '#163e8a');
    ctx.translate(0, 33);
    ctx.fillStyle = aE > 30 ? '#00c8ff' : '#f7cba8';
    if (aE > 30) { ctx.shadowBlur = 22; ctx.shadowColor = '#00c8ff'; }
    roundRect(ctx, -8, -5, 16, 16, 5);
    ctx.shadowBlur = 0;
    ctx.restore();

    // ── Left arm ──
    ctx.save();
    ctx.translate(-24, -24);
    ctx.rotate((22 - aE * 0.25) * Math.PI / 180);
    roundRect(ctx, -7, 0, 14, 38, 5, '#1e6ab8');
    ctx.translate(0, 40);
    ctx.rotate(16 * Math.PI / 180);
    roundRect(ctx, -6, 0, 12, 32, 5, '#163e8a');
    ctx.translate(0, 33);
    ctx.fillStyle  = '#f7cba8'; ctx.shadowBlur = 0;
    roundRect(ctx, -8, -5, 16, 16, 5);
    ctx.restore();

    // ── Right leg ──
    ctx.save();
    ctx.translate(12, 30);
    ctx.rotate((12 + lE) * Math.PI / 180);
    roundRect(ctx, -9, 0, 18, 44, 6, '#0d2f6a');
    ctx.translate(0, 46);
    ctx.rotate((-6 - lE * 0.4) * Math.PI / 180);
    roundRect(ctx, -8, 0, 16, 38, 6, '#091e4a');
    ctx.translate(-3, 36);
    roundRect(ctx, -8, -5, 24, 14, 4, '#111');
    ctx.restore();

    // ── Left leg ──
    ctx.save();
    ctx.translate(-12, 30);
    ctx.rotate((-12 - lE * 0.4) * Math.PI / 180);
    roundRect(ctx, -9, 0, 18, 44, 6, '#0d2f6a');
    ctx.translate(0, 46);
    ctx.rotate(6 * Math.PI / 180);
    roundRect(ctx, -8, 0, 16, 38, 6, '#091e4a');
    ctx.translate(-5, 36);
    roundRect(ctx, -8, -5, 24, 14, 4, '#111');
    ctx.restore();

    ctx.restore();
  }
}

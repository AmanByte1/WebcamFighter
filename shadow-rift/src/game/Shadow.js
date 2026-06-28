// ─────────────────────────────────────────────────────────
//  game/Shadow.js  —  AI opponent character
// ─────────────────────────────────────────────────────────
import { Fighter, roundRect } from './Fighter.js';

export class Shadow extends Fighter {
  constructor(cfg) {
    super(cfg);
    this.aiT     = 0;   // countdown to next AI decision
    this.aiAtkCD = 0;   // attack cooldown
  }

  // ── AI decision tick ───────────────────────────────────
  aiTick(dt, player) {
    this.aiT     -= dt;
    this.aiAtkCD -= dt;

    if (['hurt', 'knockdown', 'dead'].includes(this.state)) return;

    const dist = Math.abs(this.x - player.x);
    const hRatio = this.hp / this.maxHp;

    // Reactively block when player is punching close
    if (player.attacking && dist < 200 && this.aiAtkCD <= 0 && Math.random() < 0.4 * dt * 60) {
      this.setState('block', 0.45);
      return;
    }

    if (this.aiT <= 0) {
      const r = Math.random();

      if (dist > 280) {
        // Advance toward player
        this.vx = this.x > player.x ? -160 : 160;
        this.setState('walk', 0.5);
        this.aiT = 0.5;
      } else if (dist <= 200 && this.aiAtkCD <= 0) {
        // In attack range
        this.vx = 0;
        if (hRatio < 0.3 && this.power >= this.maxPower) {
          // Desperate super
          this.setState('special', 0.62);
          this.aiAtkCD = 3.0;
        } else if (r < 0.55) {
          this.setState('attack', 0.38);
          this.aiAtkCD = 1.1;
        } else if (r < 0.75) {
          this.setState('block', 0.4);
          this.aiAtkCD = 0.6;
        }
        this.aiT = 0.6 + Math.random() * 0.5;
      } else if (dist > 200 && dist < 300 && r < 0.25) {
        // Slight retreat
        this.vx = this.x > player.x ? 100 : -100;
        this.setState('walk', 0.3);
        this.aiT = 0.35;
      } else {
        this.aiT = 0.25 + Math.random() * 0.2;
      }
    }
    if (this.state !== 'walk') this.vx = 0;
  }

  // ── Draw ───────────────────────────────────────────────
  drawBody(ctx) {
    const t  = this.aTime;
    const st = this.state;
    const bob = st === 'idle' ? Math.sin(t * 3.8) * 4 : 0;

    let aE = 0, lE = 0, bL = 0;
    if (st === 'attack') {
      const p = Math.min(1, t / 0.28);
      aE = Math.sin(p * Math.PI) * 60;
      lE = Math.sin(p * Math.PI) * 20;
      bL = Math.sin(p * Math.PI) * 12;
    }
    if (st === 'special') { aE = 90;  lE = 32; bL = 24; }
    if (st === 'block')   { aE = -28; bL = -14; }
    if (st === 'hurt')    { bL = 30;  aE = -14; }

    ctx.save();
    ctx.translate(bL, bob - 200);

    // ── Torso ──
    const tg = ctx.createLinearGradient(-26, -55, 26, 55);
    tg.addColorStop(0, '#1f0030'); tg.addColorStop(1, '#090012');
    roundRect(ctx, -23, -55, 46, 85, 9, tg);

    const ag = ctx.createLinearGradient(-16, -44, 16, 12);
    ag.addColorStop(0, '#370056'); ag.addColorStop(1, '#1f0030');
    roundRect(ctx, -16, -44, 32, 50, 6, ag);

    // Red chest gem
    ctx.fillStyle  = '#ff2d55';
    ctx.shadowBlur = 16; ctx.shadowColor = '#ff2d55';
    ctx.beginPath(); ctx.arc(0, -22, 7, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // ── Head ──
    ctx.save(); ctx.translate(0, -80);

    // Dark hood
    ctx.fillStyle  = '#0e0020';
    ctx.shadowBlur = 22; ctx.shadowColor = '#6600ff';
    ctx.beginPath();
    ctx.moveTo(0, -62);
    ctx.bezierCurveTo(-32, -44, -30, 14, -22, 22);
    ctx.bezierCurveTo(-5, 32, 5, 32, 22, 22);
    ctx.bezierCurveTo(30, 14, 32, -44, 0, -62);
    ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;

    // Face
    const ff = ctx.createLinearGradient(-16, -32, 16, 14);
    ff.addColorStop(0, '#1c0030'); ff.addColorStop(1, '#0a0018');
    roundRect(ctx, -16, -32, 32, 46, 7, ff);

    // Glowing red eyes
    ctx.fillStyle  = '#ff2d55';
    ctx.shadowBlur = 16; ctx.shadowColor = '#ff2d55';
    ctx.beginPath(); ctx.ellipse(-8, -12, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse( 8, -12, 6, 5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Scar
    ctx.strokeStyle = 'rgba(255,0,0,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(5, 3); ctx.stroke();
    ctx.restore();

    // ── Arms ──
    ctx.save();
    ctx.translate(24, -24);
    ctx.rotate((-36 + aE) * Math.PI / 180);
    roundRect(ctx, -7, 0, 14, 38, 5, '#1f0030');
    ctx.translate(0, 40);
    ctx.rotate((-22 + aE * 0.4) * Math.PI / 180);
    roundRect(ctx, -6, 0, 12, 32, 5, '#160024');
    ctx.translate(0, 33);
    ctx.fillStyle = aE > 30 ? '#ff2d55' : '#2a0040';
    if (aE > 30) { ctx.shadowBlur = 22; ctx.shadowColor = '#ff2d55'; }
    roundRect(ctx, -8, -5, 16, 16, 5);
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.save();
    ctx.translate(-24, -24);
    ctx.rotate((26 - aE * 0.25) * Math.PI / 180);
    roundRect(ctx, -7, 0, 14, 38, 5, '#1f0030');
    ctx.translate(0, 40);
    ctx.rotate(20 * Math.PI / 180);
    roundRect(ctx, -6, 0, 12, 32, 5, '#160024');
    ctx.translate(0, 33);
    ctx.fillStyle  = '#2a0040'; ctx.shadowBlur = 0;
    roundRect(ctx, -8, -5, 16, 16, 5);
    ctx.restore();

    // ── Legs ──
    ctx.save();
    ctx.translate(12, 30);
    ctx.rotate((14 + lE) * Math.PI / 180);
    roundRect(ctx, -9, 0, 18, 44, 6, '#170020');
    ctx.translate(0, 46);
    ctx.rotate(-9 * Math.PI / 180);
    roundRect(ctx, -8, 0, 16, 38, 6, '#100018');
    ctx.translate(-3, 36);
    roundRect(ctx, -8, -5, 24, 14, 4, '#0a0010');
    ctx.restore();

    ctx.save();
    ctx.translate(-12, 30);
    ctx.rotate((-14 - lE * 0.4) * Math.PI / 180);
    roundRect(ctx, -9, 0, 18, 44, 6, '#170020');
    ctx.translate(0, 46);
    ctx.rotate(9 * Math.PI / 180);
    roundRect(ctx, -8, 0, 16, 38, 6, '#100018');
    ctx.translate(-5, 36);
    roundRect(ctx, -8, -5, 24, 14, 4, '#0a0010');
    ctx.restore();

    // Aura pulse
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(t * 4) * 0.08;
    ctx.fillStyle   = '#7700ff';
    ctx.shadowBlur  = 40; ctx.shadowColor = '#7700ff';
    ctx.beginPath();
    ctx.ellipse(0, -90, 52, 95, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.restore();
  }
}

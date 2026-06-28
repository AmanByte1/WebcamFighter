// ─────────────────────────────────────────────────────────
//  game/engine.js  —  Canvas helpers, particles, background
// ─────────────────────────────────────────────────────────

// ── Rounded rectangle ────────────────────────────────────
export function roundRect(ctx, x, y, w, h, r, fill) {
  if (fill) ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
  ctx.fill();
}

// ── Particle system ───────────────────────────────────────
export class ParticleSystem {
  constructor() { this.particles = []; }

  spawn(x, y, count, color, opts = {}) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (opts.spd || 5) * (0.5 + Math.random());
      this.particles.push({
        x, y,
        vx: Math.cos(angle) * speed + (opts.vx || 0),
        vy: Math.sin(angle) * speed + (opts.vy || -2),
        life: 1,
        decay: 0.022 + Math.random() * 0.03,
        r: (opts.r || 4) * (0.5 + Math.random()),
        color,
      });
    }
  }

  tick(ctx, W, H, dt) {
    ctx.clearRect(0, 0, W, H);
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x  += p.vx  * dt * 60;
      p.y  += p.vy  * dt * 60;
      p.vy += 0.15  * dt * 60;
      p.life -= p.decay * dt * 60;
      if (p.life <= 0) { this.particles.splice(i, 1); continue; }

      ctx.save();
      ctx.globalAlpha  = p.life;
      ctx.fillStyle    = p.color;
      ctx.shadowBlur   = 8;
      ctx.shadowColor  = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }
}

// ── Shockwave system ──────────────────────────────────────
export class ShockwaveSystem {
  constructor() { this.waves = []; }

  add(x, y, color) { this.waves.push({ x, y, r: 0, life: 1, color }); }

  draw(ctx) {
    for (let i = this.waves.length - 1; i >= 0; i--) {
      const w = this.waves[i];
      w.r    += 5;
      w.life -= 0.07;
      if (w.life <= 0) { this.waves.splice(i, 1); continue; }
      ctx.save();
      ctx.globalAlpha = w.life * 0.6;
      ctx.strokeStyle = w.color;
      ctx.lineWidth   = 3;
      ctx.shadowBlur  = 10;
      ctx.shadowColor = w.color;
      ctx.beginPath();
      ctx.arc(w.x, w.y, w.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }
}

// ── Arena background renderer ─────────────────────────────
export class ArenaBackground {
  constructor() { this.time = 0; }

  draw(ctx, W, H, GY, dt) {
    this.time += dt;
    const t = this.time;

    ctx.clearRect(0, 0, W, H);

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, GY);
    sky.addColorStop(0,   '#04040e');
    sky.addColorStop(0.6, '#0c001c');
    sky.addColorStop(1,   '#160030');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, H);

    // Ground gradient
    const gnd = ctx.createLinearGradient(0, GY, 0, H);
    gnd.addColorStop(0, '#180038');
    gnd.addColorStop(1, '#04040e');
    ctx.fillStyle = gnd;
    ctx.fillRect(0, GY, W, H - GY);

    // Perspective grid
    ctx.save();
    ctx.strokeStyle = 'rgba(120,0,255,0.16)';
    ctx.lineWidth   = 1;
    const vx = W / 2;
    for (let i = -10; i <= 10; i++) {
      ctx.beginPath();
      ctx.moveTo(vx + i * 90, GY);
      ctx.lineTo(vx + i * 90 * 6, GY + H);
      ctx.stroke();
    }
    for (let j = 1; j < 10; j++) {
      const pct = j / 10;
      const y   = GY + pct * (H - GY) * 1.4;
      ctx.globalAlpha = (1 - pct) * 0.6;
      ctx.beginPath();
      ctx.moveTo(0, y); ctx.lineTo(W, y);
      ctx.stroke();
    }
    ctx.restore();

    // Arena glow on ground
    const ag = ctx.createRadialGradient(W / 2, GY, 0, W / 2, GY, W * 0.44);
    ag.addColorStop(0, 'rgba(90,0,180,0.14)');
    ag.addColorStop(1, 'transparent');
    ctx.fillStyle = ag;
    ctx.beginPath();
    ctx.ellipse(W / 2, GY, W * 0.44, 55, 0, 0, Math.PI * 2);
    ctx.fill();

    // Ambient floating particles
    ctx.save();
    for (let i = 0; i < 10; i++) {
      const ft  = ((t * 0.15 + i * 0.9) % 1);
      const fx  = W * (0.08 + i * 0.09) + Math.sin(t * 0.4 + i) * 24;
      const fy  = GY * (1 - ft) * 0.92;
      const fa  = (ft < 0.1 ? ft / 0.1 : ft > 0.8 ? (1 - ft) / 0.2 : 1) * 0.22;
      ctx.globalAlpha  = fa;
      ctx.fillStyle    = i % 2 ? '#00c8ff' : '#ff2d55';
      ctx.shadowBlur   = 6;
      ctx.shadowColor  = ctx.fillStyle;
      ctx.beginPath();
      ctx.arc(fx, fy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
}

// ─────────────────────────────────────────────────────────
//  game/Fighter.js  —  Base fighter class
// ─────────────────────────────────────────────────────────
import { roundRect } from './engine.js';
export { roundRect }; // re-export for subclasses

export class Fighter {
  constructor(cfg) {
    this.x          = cfg.x    || 0;
    this.y          = 0;          // set to GY on first tick
    this.vx         = 0;
    this.vy         = 0;
    this.hp         = 100;
    this.maxHp      = 100;
    this.power      = 0;
    this.maxPower   = 5;
    this.facing     = cfg.facing || 1;
    this.state      = 'idle';
    this.stTimer    = 0;
    this.aTime      = 0;
    this.invTimer   = 0;      // invincibility after being hit
    this.atkCooldown= 0;      // prevents attack spam
    this.hitLanded  = false;  // one damage event per swing
    this.combo      = 0;
    this.comboT     = 0;
    this.scale      = 1;      // set after canvas size known
    this.name       = cfg.name || '';
    this._GY        = cfg.GY  || 0;
  }

  // ── State machine ──────────────────────────────────────
  setState(s, dur = 0) {
    if (this.state === s && s !== 'idle') return;
    this.state     = s;
    this.stTimer   = dur;
    this.aTime     = 0;
    this.hitLanded = false;
  }

  get attacking() {
    return this.state === 'attack' || this.state === 'special';
  }

  // ── Per-frame update ───────────────────────────────────
  tick(dt, opp, GY) {
    this._GY = GY;
    this.stTimer    = Math.max(0, this.stTimer    - dt);
    this.invTimer   = Math.max(0, this.invTimer   - dt);
    this.atkCooldown= Math.max(0, this.atkCooldown- dt);
    this.comboT     = Math.max(0, this.comboT     - dt);
    if (this.comboT === 0) this.combo = 0;
    this.aTime += dt;

    // Auto-return to idle
    if (this.stTimer === 0 && !['idle','walk','victory','dead'].includes(this.state)) {
      this.setState('idle');
    }

    // Gravity
    if (this.y < GY) {
      this.vy += 900 * dt;
      this.y  += this.vy * dt;
      if (this.y >= GY) {
        this.y  = GY;
        this.vy = 0;
        if (this.state === 'knockdown') this.setState('idle', 0.4);
      }
    }

    // Horizontal movement with friction
    this.x += this.vx * dt;
    if (this.state !== 'walk') this.vx *= 0.8;

    // Face opponent
    if (this.state === 'idle' || this.state === 'walk') {
      this.facing = opp.x > this.x ? 1 : -1;
    }
  }

  // ── Damage resolution ──────────────────────────────────
  takeHit(dmg, type, attackerRef, sparkFn) {
    if (this.invTimer > 0 || this.state === 'dead') return false;
    if (attackerRef && attackerRef.hitLanded)        return false;

    let actualDmg = dmg;
    let blocked   = false;

    if (this.state === 'block' && type !== 'special') {
      actualDmg = Math.max(1, Math.floor(dmg * 0.1));
      blocked   = true;
      if (sparkFn) sparkFn(this.x, this.y - this.H * 0.5, 6, '#aaaaff', { spd: 3 });
    }

    this.hp       = Math.max(0, this.hp - actualDmg);
    this.invTimer = 0.5;
    if (attackerRef) attackerRef.hitLanded = true;

    if (!blocked && actualDmg > 4) {
      this.setState(type === 'special' ? 'knockdown' : 'hurt',
                    type === 'special' ? 0.65 : 0.22);
      if (type === 'special') {
        this.vx = this.facing > 0 ? -260 : 260;
        this.vy = -170;
      }
    }

    return { dmg: actualDmg, blocked };
  }

  // ── Derived metrics ────────────────────────────────────
  get H() { return this.scale * 220; }

  // ── Draw wrapper ───────────────────────────────────────
  draw(ctx) {
    const blink = this.invTimer > 0 && Math.floor(Date.now() / 65) % 2 === 0;
    if (blink) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.scale(this.facing * this.scale, this.scale);
    this.drawBody(ctx);
    ctx.restore();

    // Ground shadow ellipse
    ctx.save();
    ctx.globalAlpha = 0.22;
    ctx.fillStyle   = '#000';
    ctx.beginPath();
    ctx.ellipse(this.x, this.y + 3, 36 * this.scale, 6 * this.scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Override in subclasses
  drawBody(ctx) {}
}

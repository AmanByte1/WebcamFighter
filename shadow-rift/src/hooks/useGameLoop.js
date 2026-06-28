// ─────────────────────────────────────────────────────────
//  hooks/useGameLoop.js
//  Manages canvas refs, game state, fighter instances,
//  hit detection, round logic and the rAF game loop.
// ─────────────────────────────────────────────────────────
import { useEffect, useRef, useCallback } from 'react';
import { Kai }    from '../game/Kai.js';
import { Shadow } from '../game/Shadow.js';
import { ParticleSystem, ShockwaveSystem, ArenaBackground } from '../game/engine.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export function useGameLoop({
  bgRef, gameRef, fxRef,
  onHudUpdate,
  onBanner,
  onRoundEnd,
  onDamageNumber,
}) {
  // ── Canvas context refs ────────────────────────────────
  const bgX  = useRef(null);
  const gX   = useRef(null);
  const pX   = useRef(null);

  // ── Game object refs ───────────────────────────────────
  const playerRef    = useRef(null);
  const aiRef        = useRef(null);
  const gsRef        = useRef({
    running: false, round: 1, pWins: 0, aWins: 0,
    playerAction: 'idle', lastTs: 0,
  });
  const comboRef     = useRef(null);   // { n, t }
  const shakeRef     = useRef(0);

  // ── Sub-systems ────────────────────────────────────────
  const particles    = useRef(new ParticleSystem());
  const shockwaves   = useRef(new ShockwaveSystem());
  const arena        = useRef(new ArenaBackground());

  // ── Timers ─────────────────────────────────────────────
  const timerIntRef  = useRef(null);
  const roundTimeRef = useRef(60);
  const rafRef       = useRef(null);

  // ── Sizes ─────────────────────────────────────────────
  const W = useRef(0), H = useRef(0), GY = useRef(0);

  // ── Resize helper ──────────────────────────────────────
  const resize = useCallback(() => {
    W.current  = window.innerWidth;
    H.current  = window.innerHeight;
    GY.current = H.current * 0.72;
    [bgRef, gameRef, fxRef].forEach(r => {
      if (r.current) {
        r.current.width  = W.current;
        r.current.height = H.current;
      }
    });
    if (playerRef.current) playerRef.current.scale = Math.min(W.current, H.current) * 0.00128;
    if (aiRef.current)     aiRef.current.scale     = Math.min(W.current, H.current) * 0.00128;
  }, [bgRef, gameRef, fxRef]);

  // ── Init fighters for a round ──────────────────────────
  const initFighters = useCallback(() => {
    const sc = Math.min(W.current, H.current) * 0.00128;
    const GYv = GY.current;

    const p = new Kai({ x: W.current * 0.28, facing: 1,  name: 'Kai',    GY: GYv });
    p.y     = GYv;
    p.scale = sc;
    playerRef.current = p;

    const a = new Shadow({ x: W.current * 0.72, facing: -1, name: 'Shadow', GY: GYv });
    a.y     = GYv;
    a.scale = sc;
    aiRef.current = a;
  }, []);

  // ── Spark shorthand ────────────────────────────────────
  const spark = useCallback((x, y, n, col, opts) => {
    particles.current.spawn(x, y, n, col, opts);
  }, []);

  // ── Hit detection ──────────────────────────────────────
  const checkHits = useCallback(() => {
    const player = playerRef.current;
    const ai     = aiRef.current;
    if (!player || !ai) return;

    const hr   = W.current * 0.105;
    const yTol = 100;

    // Player → AI
    if (player.attacking && !player.hitLanded &&
        Math.abs(player.x - ai.x) < hr && Math.abs(player.y - ai.y) < yTol) {
      const dmg = player.state === 'special' ? 24 : 12;
      const res = ai.takeHit(dmg, player.state, player, spark);
      if (res) {
        spark(ai.x, ai.y - ai.H * 0.45, player.state === 'special' ? 28 : 12,
              '#ffd700', { spd: player.state === 'special' ? 7 : 4 });
        shockwaves.current.add(ai.x, ai.y - ai.H * 0.45,
              player.state === 'special' ? '#ff2d55' : '#ffd700');
        shakeRef.current = Math.max(shakeRef.current, player.state === 'special' ? 6.7 : 2.5);
        if (onDamageNumber) onDamageNumber(ai.x, ai.y - ai.H * 0.7, res.dmg, res.blocked ? '#aaaaff' : '#ffd700');

        player.combo++;
        player.comboT = 1.4;
        player.power  = player.state === 'special' ? 0 : Math.min(player.maxPower, player.power + 1);
        if (player.combo >= 2) comboRef.current = { n: player.combo, t: 1.2 };
      }
    }

    // AI → Player
    if (ai.attacking && !ai.hitLanded &&
        Math.abs(ai.x - player.x) < hr && Math.abs(ai.y - player.y) < yTol) {
      const dmg = ai.state === 'special' ? 20 : 9;
      const res = player.takeHit(dmg, ai.state, ai, spark);
      if (res) {
        spark(player.x, player.y - player.H * 0.45, ai.state === 'special' ? 25 : 10,
              '#ff2d55', { spd: 4 });
        shockwaves.current.add(player.x, player.y - player.H * 0.45, '#ff2d55');
        shakeRef.current = Math.max(shakeRef.current, 2.5);
        if (onDamageNumber) onDamageNumber(player.x, player.y - player.H * 0.7, res.dmg, res.blocked ? '#aaaaff' : '#ff2d55');
        ai.power = ai.state === 'special' ? 0 : Math.min(ai.maxPower, ai.power + 1);
      }
    }
  }, [spark, onDamageNumber]);

  // ── Round / game management ────────────────────────────
  const endRound = useCallback(async (who) => {
    const gs = gsRef.current;
    gs.running = false;
    clearInterval(timerIntRef.current);

    if (who === 'player') {
      gs.pWins++;
      if (onBanner) onBanner('YOU WIN!', '#00c8ff');
      playerRef.current?.setState('victory');
    } else if (who === 'ai') {
      gs.aWins++;
      if (onBanner) onBanner('SHADOW WINS!', '#ff2d55');
      aiRef.current?.setState('victory');
    } else {
      if (onBanner) onBanner('DRAW', '#ffd700');
    }

    await sleep(2600);

    if (gs.pWins >= 2 || gs.aWins >= 2 || gs.round >= 3) {
      if (onRoundEnd) onRoundEnd('gameover', gs.pWins, gs.aWins);
    } else {
      gs.round++;
      startRound();
    }
  }, [onBanner, onRoundEnd]);

  const checkRoundEnd = useCallback(() => {
    const gs     = gsRef.current;
    const player = playerRef.current;
    const ai     = aiRef.current;
    if (!gs.running || !player || !ai) return;
    if (player.hp <= 0) endRound('ai');
    else if (ai.hp <= 0) endRound('player');
  }, [endRound]);

  const startTimer = useCallback(() => {
    clearInterval(timerIntRef.current);
    roundTimeRef.current = 60;
    timerIntRef.current = setInterval(() => {
      roundTimeRef.current--;
      if (onHudUpdate) onHudUpdate({ timerTick: roundTimeRef.current });
      if (roundTimeRef.current <= 0) {
        clearInterval(timerIntRef.current);
        const p = playerRef.current, a = aiRef.current;
        if (p && a) {
          if (p.hp > a.hp) endRound('player');
          else if (a.hp > p.hp) endRound('ai');
          else endRound('draw');
        }
      }
    }, 1000);
  }, [onHudUpdate, endRound]);

  const startRound = useCallback(async () => {
    initFighters();
    const gs = gsRef.current;
    if (onBanner) onBanner('ROUND ' + gs.round, '#ffd700');
    if (onHudUpdate) onHudUpdate({ round: gs.round });
    await sleep(1600);
    if (onBanner) onBanner('FIGHT!', '#fff');
    gs.running = true;
    startTimer();
  }, [initFighters, onBanner, onHudUpdate, startTimer]);

  // ── Apply player pose / button action ──────────────────
  const applyPlayerAction = useCallback((action) => {
    const player = playerRef.current;
    const gs     = gsRef.current;
    if (!player || !gs.running || player.state === 'dead') return;
    if (['attack','special','hurt','knockdown'].includes(player.state)) return;

    if (action === 'special' && player.power >= player.maxPower && player.atkCooldown <= 0) {
      player.setState('special', 0.62);
      player.atkCooldown = 1.2;
      if (onBanner) onBanner('SUPER MOVE!', '#ffd700');
      spark(player.x, player.y - player.H * 0.5, 40, '#00c8ff', { spd: 6 });
    } else if ((action === 'punch' || action === 'kick') && player.atkCooldown <= 0) {
      player.setState('attack', 0.3);
      player.atkCooldown = 0.55;
    } else if (action === 'block') {
      if (player.state !== 'block') player.setState('block', 0.12);
    } else if (!['idle','walk'].includes(player.state)) {
      player.setState('idle');
    }
  }, [spark, onBanner]);

  // Expose so App can call it from button / pose callbacks
  const playerActionRef = useRef(applyPlayerAction);
  useEffect(() => { playerActionRef.current = applyPlayerAction; }, [applyPlayerAction]);

  const movePlayerRef = useRef(null);
  movePlayerRef.current = (fraction) => {
    if (!playerRef.current) return;
    const targetX = W.current * 0.1 + fraction * (W.current * 0.78);
    playerRef.current.x += (targetX - playerRef.current.x) * 0.14;
  };

  const movePlayer = useCallback((fraction) => {
    movePlayerRef.current?.(fraction);
  }, []);

  const dispatchAction = useCallback((action) => {
    playerActionRef.current?.(action);
  }, []);

  // ── Main rAF loop ──────────────────────────────────────
  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);

    // Get canvas contexts
    bgX.current  = bgRef.current?.getContext('2d');
    gX.current   = gameRef.current?.getContext('2d');
    pX.current   = fxRef.current?.getContext('2d');

    function loop(ts) {
      const gs = gsRef.current;
      const dt = Math.min(0.05, (ts - gs.lastTs) / 1000);
      gs.lastTs = ts;

      // Screen shake
      shakeRef.current *= 0.82;
      const sx = shakeRef.current * (Math.random() - 0.5);
      const sy = shakeRef.current * (Math.random() - 0.5);

      const ctx  = gX.current;
      const bctx = bgX.current;

      if (ctx) {
        ctx.setTransform(1, 0, 0, 1, sx, sy);
        ctx.clearRect(-100, -100, W.current + 200, H.current + 200);
      }

      // Draw background
      if (bctx) arena.current.draw(bctx, W.current, H.current, GY.current, dt);

      const player = playerRef.current;
      const ai     = aiRef.current;

      if (player && ai && ctx) {
        // AI brain
        ai.aiTick(dt, player);

        // Tick fighters
        player.tick(dt, ai,     GY.current);
        ai.tick    (dt, player, GY.current);

        // Clamp positions
        const mar = W.current * 0.055;
        player.x = Math.max(mar, Math.min(W.current - mar, player.x));
        ai.x     = Math.max(mar, Math.min(W.current - mar, ai.x));

        if (gs.running) { checkHits(); checkRoundEnd(); }

        // HUD update
        if (onHudUpdate) {
          onHudUpdate({
            playerHp    : player.hp,
            playerPower : player.power,
            aiHp        : ai.hp,
            aiPower     : ai.power,
            superReady  : player.power >= player.maxPower,
          });
        }

        // Draw fighters
        player.draw(ctx);
        ai.draw(ctx);

        // Shockwaves
        shockwaves.current.draw(ctx);

        // Combo text
        if (comboRef.current) {
          comboRef.current.t -= dt;
          if (comboRef.current.t <= 0) {
            comboRef.current = null;
          } else {
            ctx.save();
            ctx.globalAlpha = Math.min(1, comboRef.current.t * 1.5);
            ctx.font        = `bold ${Math.min(46 + comboRef.current.n * 3, 70)}px Orbitron,sans-serif`;
            ctx.fillStyle   = '#ffd700';
            ctx.shadowBlur  = 22; ctx.shadowColor = '#ffd700';
            ctx.textAlign   = 'center';
            ctx.fillText(comboRef.current.n + 'x COMBO!', player.x, player.y - player.H - 12);
            ctx.restore();
          }
        }

        ctx.setTransform(1, 0, 0, 1, 0, 0);
      }

      // Particles on fx canvas
      if (pX.current) particles.current.tick(pX.current, W.current, H.current, dt);

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafRef.current);
      clearInterval(timerIntRef.current);
    };
  }, [resize, bgRef, gameRef, fxRef, checkHits, checkRoundEnd, onHudUpdate]);

  // Public API
  return {
    startRound,
    dispatchAction,
    movePlayer,
    getGameState: () => gsRef.current,
    getPlayer:    () => playerRef.current,
    resetGame: () => {
      const gs = gsRef.current;
      gs.pWins = 0; gs.aWins = 0; gs.round = 1;
      startRound();
    },
  };
}

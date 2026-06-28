// src/App.jsx
import React, {
  useState, useRef, useCallback, useEffect,
} from 'react';

import { TitleScreen }        from './components/TitleScreen.jsx';
import { GameOverScreen }     from './components/GameOverScreen.jsx';
import { CalibrationOverlay } from './components/CalibrationOverlay.jsx';
import { ActionBanner }       from './components/ActionBanner.jsx';
import { HUD }                from './components/HUD.jsx';
import { BottomHUD }          from './components/BottomHUD.jsx';
import { ControlButtons }     from './components/ControlButtons.jsx';
import { DamageNumbers, useDamageNumbers } from './components/DamageNumbers.jsx';
import { useGameLoop }        from './hooks/useGameLoop.js';
import { usePoseDetection }   from './hooks/usePoseDetection.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

// ── App-level game phases ──────────────────────────────────
// 'title' | 'calibrating' | 'playing' | 'gameover'

export default function App() {
  // ── Phase ──────────────────────────────────────────────
  const [phase,      setPhase]      = useState('title');
  const [calibCount, setCalibCount] = useState(3);

  // ── HUD state (updated by game loop via callback) ───────
  const [playerHp,    setPlayerHp]    = useState(100);
  const [playerPower, setPlayerPower] = useState(0);
  const [aiHp,        setAiHp]        = useState(100);
  const [aiPower,     setAiPower]     = useState(0);
  const [timer,       setTimer]       = useState(60);
  const [round,       setRound]       = useState(1);
  const [superReady,  setSuperReady]  = useState(false);
  const [pWins,       setPWins]       = useState(0);
  const [aWins,       setAWins]       = useState(0);

  // ── Banner ─────────────────────────────────────────────
  const [bannerText,  setBannerText]  = useState('');
  const [bannerColor, setBannerColor] = useState('#fff');
  const bannerKey = useRef(0);
  const [bannerKeyState, setBannerKeyState] = useState(0);

  // ── Canvas refs ────────────────────────────────────────
  const bgRef   = useRef(null);
  const gameRef = useRef(null);
  const fxRef   = useRef(null);

  // ── Video refs ─────────────────────────────────────────
  const webcamRef = useRef(null);   // hidden full-res webcam for pose
  const pipRef    = useRef(null);   // pip display video

  // ── Button hold state ──────────────────────────────────
  const holdRef   = useRef({ left: false, right: false, block: false });
  const holdRafRef= useRef(null);

  // ── Damage numbers ──────────────────────────────────────
  const { numbers: dmgNumbers, showDamage } = useDamageNumbers();

  // ── HUD update callback from game loop ─────────────────
  const handleHudUpdate = useCallback((data) => {
    if (data.playerHp    !== undefined) setPlayerHp(Math.round(data.playerHp));
    if (data.playerPower !== undefined) setPlayerPower(Math.floor(data.playerPower));
    if (data.aiHp        !== undefined) setAiHp(Math.round(data.aiHp));
    if (data.aiPower     !== undefined) setAiPower(Math.floor(data.aiPower));
    if (data.timerTick   !== undefined) setTimer(data.timerTick);
    if (data.round       !== undefined) setRound(data.round);
    if (data.superReady  !== undefined) setSuperReady(data.superReady);
  }, []);

  // ── Banner callback from game loop ─────────────────────
  const handleBanner = useCallback((text, color) => {
    bannerKey.current++;
    setBannerText(text);
    setBannerColor(color || '#fff');
    setBannerKeyState(bannerKey.current);
  }, []);

  // ── Round-end / game-over callback ─────────────────────
  const handleRoundEnd = useCallback((type, pw, aw) => {
    if (type === 'gameover') {
      setPWins(pw);
      setAWins(aw);
      setPhase('gameover');
    }
  }, []);

  // ── Init game loop hook ────────────────────────────────
  const {
    startRound,
    dispatchAction,
    movePlayer,
    resetGame,
  } = useGameLoop({
    bgRef, gameRef, fxRef,
    onHudUpdate   : handleHudUpdate,
    onBanner      : handleBanner,
    onRoundEnd    : handleRoundEnd,
    onDamageNumber: showDamage,
  });

  // ── Pose detection ─────────────────────────────────────
  const [poseEnabled, setPoseEnabled] = useState(false);

  const handlePoseAction = useCallback((action) => {
    dispatchAction(action);
  }, [dispatchAction]);

  const handlePoseMove = useCallback((fraction) => {
    movePlayer(fraction);
  }, [movePlayer]);

  const { status: poseStatus, action: poseAction } = usePoseDetection({
    videoRef : webcamRef,
    onAction : handlePoseAction,
    onMove   : handlePoseMove,
    enabled  : poseEnabled,
  });

  // ── Keyboard controls (always active as fallback) ──────
  useEffect(() => {
    if (phase !== 'playing') return;
    const keys = {};

    const onDown = (e) => {
      keys[e.code] = true;
      applyKeys();
    };
    const onUp = (e) => {
      keys[e.code] = false;
      applyKeys();
    };

    function applyKeys() {
      if (keys['KeyA'] || keys['ArrowLeft'])  movePlayer(0.15);
      if (keys['KeyD'] || keys['ArrowRight']) movePlayer(0.85);
      if (keys['KeyZ'])     dispatchAction('punch');
      if (keys['KeyS'])     dispatchAction('kick');
      if (keys['KeyX'])     holdRef.current.block = true;
      else                  holdRef.current.block = keys['KeyX'];
      if (keys['Space'])    dispatchAction('special');
    }

    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup',   onUp);
    };
  }, [phase, dispatchAction, movePlayer]);

  // ── Button hold loop ────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;

    function holdLoop() {
      const h = holdRef.current;
      if (h.left)  movePlayer(0.1);
      if (h.right) movePlayer(0.9);
      if (h.block) dispatchAction('block');
      holdRafRef.current = requestAnimationFrame(holdLoop);
    }
    holdRafRef.current = requestAnimationFrame(holdLoop);

    return () => cancelAnimationFrame(holdRafRef.current);
  }, [phase, dispatchAction, movePlayer]);

  // ── Start game flow ────────────────────────────────────
  const handleStart = useCallback(async () => {
    setPhase('calibrating');
    setCalibCount(3);

    // Request camera
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 480 }, facingMode: 'user' },
        audio: false,
      });

      if (webcamRef.current) {
        webcamRef.current.srcObject = stream;
        await webcamRef.current.play();
      }
      if (pipRef.current) {
        pipRef.current.srcObject = stream;
        pipRef.current.play().catch(() => {});
      }
    } catch (err) {
      console.warn('Camera error:', err.name, '— continuing without camera');
    }

    // Calibration countdown
    for (let i = 3; i >= 1; i--) {
      setCalibCount(i);
      await sleep(1000);
    }

    // Enable pose detection
    setPoseEnabled(true);

    // Switch to playing
    setPhase('playing');
    startRound();
  }, [startRound]);

  // ── Retry ──────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setPhase('playing');
    setPWins(0);
    setAWins(0);
    setPlayerHp(100);
    setAiHp(100);
    setPlayerPower(0);
    setAiPower(0);
    setTimer(60);
    setRound(1);
    resetGame();
  }, [resetGame]);

  // ── Button handlers ────────────────────────────────────
  const handleMoveStart = useCallback((dir) => {
    if (dir === 'left')  holdRef.current.left  = true;
    if (dir === 'right') holdRef.current.right = true;
    if (dir === 'block') holdRef.current.block = true;
  }, []);

  const handleMoveEnd = useCallback(() => {
    holdRef.current.left  = false;
    holdRef.current.right = false;
    holdRef.current.block = false;
  }, []);

  // ── Render ─────────────────────────────────────────────
  return (
    <>
      {/* ── Atmosphere overlays (always present) ── */}
      <div className="scanlines" />
      <div className="vignette"  />

      {/* ── Hidden webcam for pose (must be mounted always after start) ── */}
      <video
        ref={webcamRef}
        className="webcam-hidden"
        playsInline
        muted
        autoPlay
      />

      {/* ── Canvas layers ── */}
      <canvas ref={bgRef}   id="canvas-bg"   className="canvas-bg"   />
      <canvas ref={gameRef} id="canvas-game" className="canvas-game" />
      <canvas ref={fxRef}   id="canvas-fx"   className="canvas-fx"   />

      {/* ── TITLE ── */}
      {phase === 'title' && (
        <TitleScreen onStart={handleStart} />
      )}

      {/* ── CALIBRATION ── */}
      {phase === 'calibrating' && (
        <CalibrationOverlay countdown={calibCount} />
      )}

      {/* ── IN-GAME UI ── */}
      {phase === 'playing' && (
        <>
          <HUD
            playerHp={playerHp}
            playerPower={playerPower}
            aiHp={aiHp}
            aiPower={aiPower}
            timer={timer}
            round={round}
          />

          <ActionBanner
            key={bannerKeyState}
            text={bannerText}
            color={bannerColor}
          />

          <BottomHUD
            poseStatus={poseStatus}
            poseAction={poseAction}
            pipVideoRef={pipRef}
          />

          <ControlButtons
            onAction={dispatchAction}
            onMoveStart={handleMoveStart}
            onMoveEnd={handleMoveEnd}
            superReady={superReady}
          />
        </>
      )}

      {/* ── GAME OVER ── */}
      {phase === 'gameover' && (
        <GameOverScreen
          playerWins={pWins}
          aiWins={aWins}
          onRetry={handleRetry}
        />
      )}

      {/* ── Damage numbers (always rendered on top) ── */}
      <DamageNumbers numbers={dmgNumbers} />
    </>
  );
}

// src/App.jsx  —  Shadow Rift (Session + MongoDB)
import React, { useState, useRef, useCallback, useEffect } from 'react';

import { usePlayer }           from './context/PlayerContext.jsx';
import { saveMatch }           from './services/api.js';

// Screens
import { LoginScreen }         from './components/LoginScreen.jsx';
import { TitleScreen }         from './components/TitleScreen.jsx';
import { MatchResultScreen }   from './components/MatchResultScreen.jsx';
import { CalibrationOverlay }  from './components/CalibrationOverlay.jsx';
import { Leaderboard }         from './components/Leaderboard.jsx';
import { PlayerProfile }       from './components/PlayerProfile.jsx';

// In-game UI
import { ActionBanner }        from './components/ActionBanner.jsx';
import { HUD }                 from './components/HUD.jsx';
import { BottomHUD }           from './components/BottomHUD.jsx';
import { ControlButtons }      from './components/ControlButtons.jsx';
import { DamageNumbers, useDamageNumbers } from './components/DamageNumbers.jsx';

// Hooks
import { useGameLoop }         from './hooks/useGameLoop.js';
import { usePoseDetection }    from './hooks/usePoseDetection.js';

const sleep = ms => new Promise(r => setTimeout(r, ms));

export default function App() {
  const { player, offline, loading: sessionLoading, logout } = usePlayer();

  // ── Phase ──────────────────────────────────────────
  // 'loading' → 'login' → 'title' → 'calibrating' → 'playing' → 'result'
  // 'leaderboard' and 'profile' can be reached from title or result
  const [phase, setPhase] = useState('loading');

  // ── Auto-restore session on app load ───────────────
  // When PlayerContext finishes checking the session cookie:
  // - Found valid session  → skip login, go to title
  // - No session / expired → show login screen
  useEffect(() => {
    if (sessionLoading) return; // still checking
    if (player) {
      setPhase('title');         // session restored — skip login
    } else {
      setPhase('login');         // no session — show login
    }
  }, [sessionLoading, player]);

  const [calibCount,  setCalibCount]  = useState(3);
  const [matchResult, setMatchResult] = useState(null);
  const [matchSave,   setMatchSave]   = useState(null);

  // HUD state
  const [playerHp,    setPlayerHp]    = useState(100);
  const [playerPower, setPlayerPower] = useState(0);
  const [aiHp,        setAiHp]        = useState(100);
  const [aiPower,     setAiPower]     = useState(0);
  const [timer,       setTimer]       = useState(60);
  const [round,       setRound]       = useState(1);
  const [superReady,  setSuperReady]  = useState(false);

  // Banner
  const [bannerText,  setBannerText]  = useState('');
  const [bannerColor, setBannerColor] = useState('#fff');
  const [bannerKey,   setBannerKey]   = useState(0);

  // Canvas & video refs
  const bgRef     = useRef(null);
  const gameRef   = useRef(null);
  const fxRef     = useRef(null);
  const webcamRef = useRef(null);
  const pipRef    = useRef(null);

  // Button hold state
  const holdRef    = useRef({ left:false, right:false, block:false });
  const holdRafRef = useRef(null);

  // Match stats
  const matchStatsRef = useRef({
    dmgDealt:0, dmgTaken:0, bestCombo:0, superMovesUsed:0,
    punchesThrown:0, kicksThrown:0, blocksUsed:0,
    wasKO:false, rounds:[], startTime: Date.now(),
  });

  const { numbers: dmgNumbers, showDamage } = useDamageNumbers();

  // ── Callbacks ──────────────────────────────────────
  const handleHudUpdate = useCallback((data) => {
    if (data.playerHp    !== undefined) setPlayerHp(Math.round(data.playerHp));
    if (data.playerPower !== undefined) setPlayerPower(Math.floor(data.playerPower));
    if (data.aiHp        !== undefined) setAiHp(Math.round(data.aiHp));
    if (data.aiPower     !== undefined) setAiPower(Math.floor(data.aiPower));
    if (data.timerTick   !== undefined) setTimer(data.timerTick);
    if (data.round       !== undefined) setRound(data.round);
    if (data.superReady  !== undefined) setSuperReady(data.superReady);
  }, []);

  const handleBanner = useCallback((text, color) => {
    setBannerText(text); setBannerColor(color || '#fff');
    setBannerKey(k => k + 1);
  }, []);

  const handleRoundEnd = useCallback(async (type, pWins, aWins) => {
    if (type !== 'gameover') return;
    const result   = pWins > aWins ? 'win' : aWins > pWins ? 'loss' : 'draw';
    const ms       = matchStatsRef.current;
    const duration = Math.round((Date.now() - ms.startTime) / 1000);
    setMatchResult({ playerWins: pWins, aiWins: aWins, stats: ms });
    if (player?.username && !offline) {
      try {
        const saved = await saveMatch({
          username: player.username, result,
          playerRoundWins: pWins, aiRoundWins: aWins,
          rounds: ms.rounds, stats: { ...ms, wasKO: ms.wasKO }, duration,
        });
        setMatchSave(saved);
      } catch { setMatchSave(null); }
    }
    setPhase('result');
  }, [player, offline]);

  // ── Game loop hook ──────────────────────────────────
  const { startRound, dispatchAction, movePlayer, resetGame } = useGameLoop({
    bgRef, gameRef, fxRef,
    onHudUpdate   : handleHudUpdate,
    onBanner      : handleBanner,
    onRoundEnd    : handleRoundEnd,
    onDamageNumber: (x,y,dmg,col) => showDamage(x,y,dmg,col),
  });

  // ── Pose detection ──────────────────────────────────
  const [poseEnabled, setPoseEnabled] = useState(false);
  const { status: poseStatus, action: poseAction } = usePoseDetection({
    videoRef: webcamRef, onAction: dispatchAction,
    onMove: movePlayer,  enabled: poseEnabled,
  });

  // ── Keyboard ────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    const keys = {};
    const onDown = e => { keys[e.code]=true;  applyKeys(); };
    const onUp   = e => { keys[e.code]=false; applyKeys(); };
    function applyKeys(){
      if (keys['KeyA']||keys['ArrowLeft'])  movePlayer(0.15);
      if (keys['KeyD']||keys['ArrowRight']) movePlayer(0.85);
      if (keys['KeyZ']) dispatchAction('punch');
      if (keys['KeyS']) dispatchAction('kick');
      if (keys['KeyX']) dispatchAction('block');
      if (keys['Space']) dispatchAction('special');
    }
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup',   onUp);
    return () => { window.removeEventListener('keydown',onDown); window.removeEventListener('keyup',onUp); };
  }, [phase, dispatchAction, movePlayer]);

  // ── Button hold loop ────────────────────────────────
  useEffect(() => {
    if (phase !== 'playing') return;
    function loop(){
      const h = holdRef.current;
      if (h.left)  movePlayer(0.1);
      if (h.right) movePlayer(0.9);
      if (h.block) dispatchAction('block');
      holdRafRef.current = requestAnimationFrame(loop);
    }
    holdRafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(holdRafRef.current);
  }, [phase, dispatchAction, movePlayer]);

  // ── Handlers ────────────────────────────────────────
  const handleStart = useCallback(async () => {
    setPhase('calibrating'); setCalibCount(3);
    matchStatsRef.current = {
      dmgDealt:0, dmgTaken:0, bestCombo:0, superMovesUsed:0,
      punchesThrown:0, kicksThrown:0, blocksUsed:0,
      wasKO:false, rounds:[], startTime: Date.now(),
    };
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video:{ width:{ideal:640}, height:{ideal:480}, facingMode:'user' }, audio:false,
      });
      if (webcamRef.current){ webcamRef.current.srcObject=stream; await webcamRef.current.play(); }
      if (pipRef.current)   { pipRef.current.srcObject=stream; pipRef.current.play().catch(()=>{}); }
    } catch(e){ console.warn('Camera unavailable:', e.name); }
    for (let i=3; i>=1; i--){ setCalibCount(i); await sleep(1000); }
    setPoseEnabled(true);
    setPhase('playing');
    startRound();
  }, [startRound]);

  const handleRetry = useCallback(() => {
    setPhase('playing');
    setPlayerHp(100); setAiHp(100); setPlayerPower(0);
    setAiPower(0);    setTimer(60); setRound(1);
    matchStatsRef.current = {
      dmgDealt:0, dmgTaken:0, bestCombo:0, superMovesUsed:0,
      punchesThrown:0, kicksThrown:0, blocksUsed:0,
      wasKO:false, rounds:[], startTime: Date.now(),
    };
    resetGame();
  }, [resetGame]);

  // ── Logout — destroys session, goes back to login ───
  const handleLogout = useCallback(async () => {
    await logout();
    setPhase('login');
    setMatchResult(null);
    setMatchSave(null);
  }, [logout]);

  const handleLogin = useCallback(() => setPhase('title'), []);

  const handleMoveStart = useCallback((dir) => {
    if (dir==='left')  holdRef.current.left =true;
    if (dir==='right') holdRef.current.right=true;
    if (dir==='block') holdRef.current.block=true;
  },[]);
  const handleMoveEnd = useCallback(()=>{
    holdRef.current.left=holdRef.current.right=holdRef.current.block=false;
  },[]);

  // ── Render ──────────────────────────────────────────
  return (
    <>
      <div className="scanlines" />
      <div className="vignette"  />
      <video ref={webcamRef} className="webcam-hidden" playsInline muted autoPlay />
      <canvas ref={bgRef}   id="canvas-bg"   className="canvas-bg"   />
      <canvas ref={gameRef} id="canvas-game" className="canvas-game" />
      <canvas ref={fxRef}   id="canvas-fx"   className="canvas-fx"   />

      {/* Loading — checking session */}
      {phase === 'loading' && (
        <div className="screen" style={{ background:'#05050f' }}>
          <div style={{ fontFamily:'Orbitron,sans-serif', color:'#ffffff33',
                        fontSize:'1rem', letterSpacing:'.3em' }}>
            LOADING…
          </div>
        </div>
      )}

      {/* Login */}
      {phase === 'login' && <LoginScreen onLogin={handleLogin} />}

      {/* Title */}
      {phase === 'title' && (
        <TitleScreen
          onStart={handleStart}
          onLeaderboard={() => setPhase('leaderboard')}
          onProfile={() => setPhase('profile')}
          onLogout={handleLogout}
        />
      )}

      {/* Calibrating */}
      {phase === 'calibrating' && <CalibrationOverlay countdown={calibCount} />}

      {/* Playing */}
      {phase === 'playing' && (
        <>
          <HUD playerHp={playerHp} playerPower={playerPower}
               aiHp={aiHp} aiPower={aiPower} timer={timer} round={round} />
          <ActionBanner key={bannerKey} text={bannerText} color={bannerColor} />
          <BottomHUD poseStatus={poseStatus} poseAction={poseAction} pipVideoRef={pipRef} />
          <ControlButtons onAction={dispatchAction}
            onMoveStart={handleMoveStart} onMoveEnd={handleMoveEnd}
            superReady={superReady} />
        </>
      )}

      {/* Result */}
      {phase === 'result' && matchResult && (
        <MatchResultScreen
          result={matchResult} matchSave={matchSave}
          onPlayAgain={handleRetry}
          onLeaderboard={() => setPhase('leaderboard')}
          onProfile={() => setPhase('profile')}
        />
      )}

      {/* Leaderboard */}
      {phase === 'leaderboard' && (
        <Leaderboard currentUsername={player?.username}
          onClose={() => setPhase(matchResult ? 'result' : 'title')} />
      )}

      {/* Profile */}
      {phase === 'profile' && player && (
        <PlayerProfile player={player}
          onClose={() => setPhase(matchResult ? 'result' : 'title')} />
      )}

      <DamageNumbers numbers={dmgNumbers} />
    </>
  );
}

// ─────────────────────────────────────────────────────────
//  hooks/usePoseDetection.js
//  Initialises MediaPipe Pose and returns live pose data
// ─────────────────────────────────────────────────────────
import { useEffect, useRef, useState, useCallback } from 'react';

const SMOOTH_ALPHA = 0.3;

function smoothed(store, key, value) {
  store[key] = store[key] !== undefined
    ? store[key] * (1 - SMOOTH_ALPHA) + value * SMOOTH_ALPHA
    : value;
  return store[key];
}

export function usePoseDetection({ videoRef, onAction, onMove, enabled }) {
  const [status, setStatus]   = useState('Initialising…');
  const [action, setAction]   = useState('—');
  const sm                    = useRef({});        // smoothing store
  const baselineY             = useRef(null);      // shoulder baseline
  const rafId                 = useRef(null);
  const poseModelRef          = useRef(null);
  const noDetectFrames        = useRef(0);

  const handleResults = useCallback((res) => {
    if (!res.poseLandmarks || res.poseLandmarks.length < 25) {
      noDetectFrames.current++;
      if (noDetectFrames.current > 10) {
        setStatus('⚠ Move into frame');
        setAction('—');
        if (onAction) onAction('idle');
      }
      return;
    }

    noDetectFrames.current = 0;
    const lm = res.poseLandmarks;
    const s  = sm.current;

    // Smooth each key landmark
    const nY   = smoothed(s, 'nY',  lm[0].y);
    const lSY  = smoothed(s, 'lSY', lm[11].y);
    const rSY  = smoothed(s, 'rSY', lm[12].y);
    const lSX  = smoothed(s, 'lSX', lm[11].x);
    const rSX  = smoothed(s, 'rSX', lm[12].x);
    const lWY  = smoothed(s, 'lWY', lm[15].y);
    const rWY  = smoothed(s, 'rWY', lm[16].y);
    const hipY = smoothed(s, 'hY',  (lm[23].y + lm[24].y) / 2);
    const lKY  = smoothed(s, 'lKY', lm[25].y);
    const rKY  = smoothed(s, 'rKY', lm[26].y);
    const midY = (lSY + rSY) / 2;
    const midX = (lSX + rSX) / 2;

    // Calibrate baseline on first good frame
    if (baselineY.current === null) {
      baselineY.current = midY;
      setStatus('✅ Calibrated — fight!');
    } else {
      setStatus('📷 Pose Active ✓');
    }

    // ── Gesture detection ──────────────────────────────
    const lPunch  = lWY < lSY - 0.08;
    const rPunch  = rWY < rSY - 0.08;
    const isBlock = lWY < midY - 0.05 && rWY < midY - 0.05 && lPunch && rPunch;
    const isSuper = lWY < nY - 0.05   && rWY < nY - 0.05;
    const isDuck  = nY  > (baselineY.current || midY) + 0.14;
    const isKick  = lKY < hipY - 0.08 || rKY < hipY - 0.08;

    let detectedAction = 'idle';
    if (isSuper)              detectedAction = 'special';
    else if (isBlock)         detectedAction = 'block';
    else if (isDuck)          detectedAction = 'duck';
    else if (isKick)          detectedAction = 'kick';
    else if (lPunch || rPunch)detectedAction = 'punch';

    setAction(detectedAction.toUpperCase());
    if (onAction) onAction(detectedAction);

    // Move player based on shoulder midpoint X (inverted for mirror)
    if (onMove) onMove(1 - midX);

    // Draw skeleton on pip canvas
    drawSkeleton(lm, detectedAction);
  }, [onAction, onMove]);

  // ── Skeleton overlay on the pip video element ─────────
  function drawSkeleton(lm, currentAction) {
    const pipEl = document.getElementById('pip-video');
    if (!pipEl) return;
    const rect = pipEl.getBoundingClientRect();
    if (!rect.width) return;

    const fxCanvas = document.getElementById('canvas-fx');
    if (!fxCanvas) return;
    const ctx = fxCanvas.getContext('2d');

    const ox = rect.left, oy = rect.top, pw = rect.width, ph = rect.height;
    ctx.clearRect(ox - 1, oy - 1, pw + 2, ph + 2);

    const col = {
      punch  : '#ffd700',
      block  : '#aaaaff',
      kick   : '#ff6600',
      special: '#ff2d55',
      idle   : '#00ff88',
    }[currentAction] || '#00ff88';

    ctx.save();
    ctx.strokeStyle = col;
    ctx.lineWidth   = 1.5;
    ctx.shadowBlur  = 4;
    ctx.shadowColor = col;

    const pairs = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[0,11],[0,12]];
    pairs.forEach(([a, b]) => {
      if (!lm[a] || !lm[b]) return;
      ctx.beginPath();
      ctx.moveTo(ox + (1 - lm[a].x) * pw, oy + lm[a].y * ph);
      ctx.lineTo(ox + (1 - lm[b].x) * pw, oy + lm[b].y * ph);
      ctx.stroke();
    });

    [0,11,12,13,14,15,16,23,24,25,26].forEach(i => {
      if (!lm[i]) return;
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(ox + (1 - lm[i].x) * pw, oy + lm[i].y * ph, 2, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // ── Initialise MediaPipe ──────────────────────────────
  useEffect(() => {
    if (!enabled || !videoRef?.current) return;

    const video = videoRef.current;
    let cancelled = false;

    async function init() {
      setStatus('⏳ Loading pose model…');

      if (typeof window.Pose === 'undefined') {
        setStatus('⚠ MediaPipe not loaded — use buttons/keyboard');
        return;
      }

      try {
        const pose = new window.Pose({
          locateFile: f => `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.5.1675469404/${f}`,
        });

        pose.setOptions({
          modelComplexity        : 1,
          smoothLandmarks        : true,
          enableSegmentation     : false,
          minDetectionConfidence : 0.45,
          minTrackingConfidence  : 0.45,
        });

        pose.onResults(handleResults);
        poseModelRef.current = pose;

        setStatus('⏳ Initialising model…');
        await pose.initialize();

        setStatus('⏳ Warming up…');
        await pose.send({ image: video });

        setStatus('📷 Pose ready — stand in frame');

        // rAF loop at ~20fps
        let lastT = 0;
        async function poseLoop(ts) {
          if (cancelled) return;
          if (ts - lastT > 50 && video.readyState >= 2) {
            lastT = ts;
            try { await pose.send({ image: video }); } catch (_) {}
          }
          rafId.current = requestAnimationFrame(poseLoop);
        }
        rafId.current = requestAnimationFrame(poseLoop);

      } catch (err) {
        console.warn('Pose init failed:', err);
        setStatus('⚠ Pose unavailable — buttons/keyboard active');
      }
    }

    init();

    return () => {
      cancelled = true;
      if (rafId.current) cancelAnimationFrame(rafId.current);
      if (poseModelRef.current) poseModelRef.current.close?.();
    };
  }, [enabled, videoRef, handleResults]);

  return { status, action };
}

// src/components/ControlButtons.jsx
import React, { useCallback } from 'react';

const ChevronLeft  = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15,18 9,12 15,6"/></svg>;
const ChevronRight = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9,18 15,12 9,6"/></svg>;
const PunchIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 12l-4 4M18 3l-9 9M13 8l3-3M16 11l2-2"/><circle cx="6" cy="18" r="2"/></svg>;
const KickIcon     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M4 20l6-6M14 4l-4 8 6 4"/></svg>;
const BlockIcon    = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="6" width="18" height="13" rx="2"/><path d="M3 10h18"/></svg>;
const StarIcon     = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/></svg>;

export function ControlButtons({ onAction, onMoveStart, onMoveEnd, superReady }) {
  // Pointer-based hold for movement
  const holdStart = useCallback((dir) => (e) => {
    e.preventDefault();
    onMoveStart?.(dir);
  }, [onMoveStart]);

  const holdEnd = useCallback((e) => {
    e.preventDefault();
    onMoveEnd?.();
  }, [onMoveEnd]);

  const tap = useCallback((action) => (e) => {
    e.preventDefault();
    onAction?.(action);
  }, [onAction]);

  return (
    <div className="ctrl-buttons">
      {/* Move Left */}
      <button
        className="ctrl-btn move"
        onPointerDown={holdStart('left')}
        onPointerUp={holdEnd}
        onPointerLeave={holdEnd}
        onTouchStart={holdStart('left')}
        onTouchEnd={holdEnd}
      >
        <ChevronLeft /> Move
      </button>

      {/* Punch */}
      <button className="ctrl-btn punch" onPointerDown={tap('punch')} onTouchStart={tap('punch')}>
        <PunchIcon /> Punch
      </button>

      {/* Kick */}
      <button className="ctrl-btn kick" onPointerDown={tap('kick')} onTouchStart={tap('kick')}>
        <KickIcon /> Kick
      </button>

      {/* Block */}
      <button
        className="ctrl-btn block"
        onPointerDown={holdStart('block')}
        onPointerUp={holdEnd}
        onPointerLeave={holdEnd}
        onTouchStart={holdStart('block')}
        onTouchEnd={holdEnd}
      >
        <BlockIcon /> Block
      </button>

      {/* Move Right */}
      <button
        className="ctrl-btn move"
        onPointerDown={holdStart('right')}
        onPointerUp={holdEnd}
        onPointerLeave={holdEnd}
        onTouchStart={holdStart('right')}
        onTouchEnd={holdEnd}
      >
        <ChevronRight /> Move
      </button>

      {/* Super */}
      <button
        className={`ctrl-btn super${superReady ? '' : ' locked'}`}
        onPointerDown={superReady ? tap('special') : undefined}
        onTouchStart={superReady ? tap('special') : undefined}
      >
        <StarIcon /> SUPER
      </button>
    </div>
  );
}

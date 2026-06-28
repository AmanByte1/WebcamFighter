// src/components/ActionBanner.jsx
import React, { useEffect, useRef } from 'react';

export function ActionBanner({ text, color }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!text || !ref.current) return;
    // Restart animation by removing/re-adding class
    ref.current.classList.remove('show');
    void ref.current.offsetWidth; // reflow
    ref.current.classList.add('show');
    const t = setTimeout(() => ref.current?.classList.remove('show'), 750);
    return () => clearTimeout(t);
  }, [text]);

  return (
    <div
      ref={ref}
      className="action-banner"
      style={{ color: color || '#ffffff' }}
    >
      {text}
    </div>
  );
}

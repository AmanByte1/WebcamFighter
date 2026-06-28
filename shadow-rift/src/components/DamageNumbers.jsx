// src/components/DamageNumbers.jsx
import React, { useState, useCallback } from 'react';

let dmgId = 0;

export function useDamageNumbers() {
  const [numbers, setNumbers] = useState([]);

  const showDamage = useCallback((x, y, dmg, color) => {
    const id = ++dmgId;
    setNumbers(prev => [...prev, { id, x, y, dmg, color }]);
    setTimeout(() => {
      setNumbers(prev => prev.filter(n => n.id !== id));
    }, 900);
  }, []);

  return { numbers, showDamage };
}

export function DamageNumbers({ numbers }) {
  return (
    <>
      {numbers.map(n => (
        <div
          key={n.id}
          className="dmg-num"
          style={{
            left     : n.x - 18,
            top      : n.y - 60,
            fontSize : n.dmg > 20 ? '1.8rem' : '1.3rem',
            color    : n.color,
            textShadow: `0 0 10px ${n.color}`,
          }}
        >
          -{n.dmg}
        </div>
      ))}
    </>
  );
}

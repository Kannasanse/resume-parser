'use client';
import { useState, useRef, useCallback } from 'react';

const DURATION = 2000;

export default function HoldToDelete({ onDelete }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  const startHold = useCallback((e) => {
    e.preventDefault();
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(intervalRef.current);
        onDelete();
      }
    }, 16);
  }, [onDelete]);

  const endHold = useCallback(() => {
    clearInterval(intervalRef.current);
    setProgress(0);
  }, []);

  const remaining = progress > 0 ? Math.ceil((DURATION * (1 - progress / 100)) / 1000) : null;

  return (
    <button
      onMouseDown={startHold} onMouseUp={endHold} onMouseLeave={endHold}
      onTouchStart={startHold} onTouchEnd={endHold}
      className="relative overflow-hidden w-full px-5 py-2.5 text-sm font-semibold text-white bg-ds-danger rounded-btn select-none cursor-pointer"
    >
      <span
        className="absolute inset-y-0 left-0 bg-red-800 pointer-events-none transition-none"
        style={{ width: `${progress}%` }}
      />
      <span className="relative z-10">
        {progress > 0 ? `Hold… ${remaining}s` : 'Hold to Delete'}
      </span>
    </button>
  );
}

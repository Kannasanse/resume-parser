'use client';
import { useState, useRef, useCallback } from 'react';

const DURATION = 5000;

export default function HoldToDelete({ onDelete }) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef(null);

  const startHold = useCallback(() => {
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / DURATION) * 100);
      setProgress(pct);
      if (pct >= 100) { clearInterval(intervalRef.current); onDelete(); }
    }, 30);
  }, [onDelete]);

  const endHold = useCallback(() => {
    clearInterval(intervalRef.current);
    setProgress(0);
  }, []);

  const remaining = progress > 0 ? Math.ceil((DURATION * (1 - progress / 100)) / 1000) : null;

  return (
    <div className="relative overflow-hidden rounded-btn select-none">
      <button
        onMouseDown={startHold} onMouseUp={endHold} onMouseLeave={endHold}
        onTouchStart={startHold} onTouchEnd={endHold}
        className="relative z-10 w-full px-5 py-2.5 text-sm font-semibold text-white bg-ds-danger rounded-btn"
      >
        {progress > 0 ? `Hold to delete… ${remaining}s` : 'Hold to Delete'}
      </button>
      <div className="absolute inset-0 bg-red-800 rounded-btn pointer-events-none"
        style={{ width: `${progress}%`, opacity: 0.35 }} />
    </div>
  );
}

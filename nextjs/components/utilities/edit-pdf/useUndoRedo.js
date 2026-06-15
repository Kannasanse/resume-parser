'use client';
import { useCallback, useRef, useState } from 'react';

const MAX = 50;

export function useUndoRedo() {
  // stacks are arrays of JSON-serialisable snapshots
  const stackRef = useRef({ past: [], future: [] });
  const [, forceRender] = useState(0);
  const rerender = () => forceRender(n => n + 1);

  const record = useCallback((snapshot) => {
    const s = stackRef.current;
    s.past = [...s.past.slice(-(MAX - 1)), snapshot];
    s.future = [];
    rerender();
  }, []);

  const undo = useCallback(() => {
    const s = stackRef.current;
    if (!s.past.length) return null;
    const snapshot = s.past[s.past.length - 1];
    s.past = s.past.slice(0, -1);
    rerender();
    return snapshot;
  }, []);

  const redo = useCallback(() => {
    const s = stackRef.current;
    if (!s.future.length) return null;
    const snapshot = s.future[0];
    s.future = s.future.slice(1);
    s.past = [...s.past, snapshot];
    rerender();
    return snapshot;
  }, []);

  const canUndo = stackRef.current.past.length > 0;
  const canRedo = stackRef.current.future.length > 0;

  return { record, undo, redo, canUndo, canRedo };
}

'use client';
import { useEffect, useRef } from 'react';

export function ConsolePanel({ entries, onClear }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [entries]);

  return (
    <div style={{
      background: '#0D1117', height: '100%',
      fontFamily: '"JetBrains Mono", "Fira Code", monospace',
      fontSize: 12, overflowY: 'auto',
      padding: '8px 12px',
    }}>
      <div style={{
        display: 'flex', justifyContent: 'space-between',
        marginBottom: 8, paddingBottom: 6,
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.35)', letterSpacing: '.08em' }}>
          CONSOLE
        </span>
        <button onClick={onClear} style={{
          fontSize: 10, color: 'rgba(255,255,255,0.35)',
          background: 'none', border: 'none', cursor: 'pointer',
        }}>
          Clear
        </button>
      </div>

      {entries.length === 0 && (
        <div style={{ color: 'rgba(255,255,255,0.25)', fontSize: 11, fontStyle: 'italic' }}>
          Output will appear here...
        </div>
      )}

      {entries.map((entry, i) => (
        <div key={i} style={{
          display: 'flex', gap: 8, marginBottom: 3,
          color: entry.level === 'error' ? '#F87171'
               : entry.level === 'warn'  ? '#FBBF24'
               : '#E8EFF7',
        }}>
          <span style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
            {entry.level === 'error' ? '✗' : entry.level === 'warn' ? '⚠' : '>'}
          </span>
          <span style={{ flex: 1, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {entry.text}
          </span>
        </div>
      ))}

      <div ref={bottomRef} />
    </div>
  );
}

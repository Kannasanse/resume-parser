'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { formatDistanceToNow } from 'date-fns';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  );
}

export default function FullSearchModal({ open, onClose, onSelectNote, notes = [] }) {
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [active,  setActive]  = useState(0);
  const inputRef  = useRef(null);
  const debounce  = useRef(null);
  const listRef   = useRef(null);

  // Focus input on open
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    clearTimeout(debounce.current);
    if (!query.trim() || query.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/v1/notes/search?q=${encodeURIComponent(query.trim())}&limit=12`);
        const data = await res.json();
        setResults(data.results || []);
        setActive(0);
      } catch { setResults([]); }
      finally  { setLoading(false); }
    }, 250);
    return () => clearTimeout(debounce.current);
  }, [query]);

  const recent = notes
    .filter(n => !n.is_archived)
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

  const displayList = query.trim().length >= 2 ? results : recent;

  const handleSelect = useCallback((note) => {
    onSelectNote?.(note.id);
    onClose?.();
  }, [onSelectNote, onClose]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setActive(i => Math.min(i + 1, displayList.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(i => Math.max(i - 1, 0)); }
      if (e.key === 'Enter' && displayList[active]) { handleSelect(displayList[active]); }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, active, displayList, handleSelect, onClose]);

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.children[active];
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.50)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
        paddingTop: '12vh',
      }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div style={{
        width: 'min(680px, 90vw)', background: 'white',
        border: '1px solid #D1DCE8', borderRadius: 16,
        boxShadow: '0 24px 64px rgba(0,0,0,0.18)', overflow: 'hidden',
      }}>
        {/* Search bar */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
          borderBottom: '1px solid #D1DCE8',
        }}>
          <span style={{ color: '#9CA3AF', flexShrink: 0 }}><SearchIcon /></span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            placeholder="Search all notes…"
            style={{
              flex: 1, border: 'none', outline: 'none', background: 'transparent',
              fontSize: 16, color: '#2C2C2A',
            }}
          />
          <span style={{
            fontSize: 11, color: '#9CA3AF', background: '#F4F8FC',
            border: '1px solid #D1DCE8', borderRadius: 6, padding: '2px 6px',
            flexShrink: 0, fontFamily: 'monospace',
          }}>ESC</span>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 480, overflowY: 'auto' }} ref={listRef}>
          {/* Section label */}
          {displayList.length > 0 && (
            <p style={{ fontSize: 10, fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '10px 18px 4px', margin: 0 }}>
              {query.trim().length >= 2 ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Recent notes'}
            </p>
          )}

          {loading && (
            <div style={{ padding: '20px', textAlign: 'center', fontSize: 13, color: '#9CA3AF' }}>
              Searching…
            </div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div style={{ padding: '32px 18px', textAlign: 'center' }}>
              <p style={{ fontSize: 14, color: '#6B7280', margin: '0 0 4px' }}>
                No notes matching &ldquo;{query}&rdquo;
              </p>
              <p style={{ fontSize: 13, color: '#9CA3AF', margin: 0 }}>Try a different search term</p>
            </div>
          )}

          {!loading && displayList.map((note, i) => (
            <button
              key={note.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => handleSelect(note)}
              style={{
                width: '100%', textAlign: 'left', padding: '11px 18px',
                borderBottom: '1px solid rgba(209,220,232,0.4)',
                border: 'none', cursor: 'pointer',
                background: i === active ? 'rgba(24,95,165,0.05)' : 'white',
                borderLeft: i === active ? '3px solid #185FA5' : '3px solid transparent',
                display: 'flex', alignItems: 'center', gap: 12,
                transition: 'background 0.1s',
              }}
            >
              <span style={{ color: '#9CA3AF', flexShrink: 0 }}>
                {note.icon ? <span style={{ fontSize: 16 }}>{note.icon}</span> : <NoteIcon />}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#2C2C2A', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {note.title || 'Untitled'}
                </p>
                {note.tags?.length > 0 && (
                  <div style={{ display: 'flex', gap: 4, marginTop: 3, flexWrap: 'wrap' }}>
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} style={{ fontSize: 11, background: '#E6F1FB', color: '#185FA5', borderRadius: 9999, padding: '1px 6px' }}>#{tag}</span>
                    ))}
                  </div>
                )}
              </div>
              <span style={{ fontSize: 11, color: '#9CA3AF', flexShrink: 0, whiteSpace: 'nowrap' }}>
                {note.updated_at ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true }) : ''}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        {displayList.length > 0 && (
          <div style={{ padding: '8px 18px', borderTop: '1px solid rgba(209,220,232,0.4)', display: 'flex', gap: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>↑↓ navigate</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>↵ open</span>
            <span style={{ fontSize: 11, color: '#9CA3AF' }}>esc close</span>
          </div>
        )}
      </div>
    </div>
  );
}

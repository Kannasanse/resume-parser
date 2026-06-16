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

  useEffect(() => {
    if (open) {
      setQuery(''); setResults([]); setActive(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (!query.trim() || query.trim().length < 2) { setResults([]); setLoading(false); return; }
    setLoading(true);
    debounce.current = setTimeout(async () => {
      try {
        const res  = await fetch(`/api/v1/notes/search?q=${encodeURIComponent(query.trim())}&limit=12`);
        const data = await res.json();
        setResults(data.results || []); setActive(0);
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

  useEffect(() => {
    const el = listRef.current?.children[active];
    el?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center bg-black/50 backdrop-blur-sm pt-[12vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
    >
      <div className="w-[min(680px,90vw)] bg-white dark:bg-[#1A2C45] border border-[#D1DCE8] dark:border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* Search bar */}
        <div className="flex items-center gap-3 px-[18px] py-3.5 border-b border-[#D1DCE8] dark:border-white/10">
          <span className="text-[#9CA3AF] flex-shrink-0"><SearchIcon /></span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => { setQuery(e.target.value); setActive(0); }}
            placeholder="Search all notes…"
            className="flex-1 border-none outline-none bg-transparent text-base text-[#2C2C2A] dark:text-[#E8EFF7] placeholder:text-[#9CA3AF]"
          />
          <span className="text-[11px] text-[#9CA3AF] bg-[#F4F8FC] dark:bg-white/5 border border-[#D1DCE8] dark:border-white/10 rounded-md px-1.5 py-0.5 flex-shrink-0 font-mono">
            ESC
          </span>
        </div>

        {/* Results */}
        <div className="max-h-[480px] overflow-y-auto" ref={listRef}>
          {displayList.length > 0 && (
            <p className="text-[10px] font-semibold text-[#9CA3AF] uppercase tracking-widest px-[18px] pt-2.5 pb-1">
              {query.trim().length >= 2 ? `${results.length} result${results.length !== 1 ? 's' : ''}` : 'Recent notes'}
            </p>
          )}

          {loading && (
            <div className="py-5 text-center text-[13px] text-[#9CA3AF]">Searching…</div>
          )}

          {!loading && query.trim().length >= 2 && results.length === 0 && (
            <div className="py-8 px-[18px] text-center">
              <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1] mb-1">No notes matching &ldquo;{query}&rdquo;</p>
              <p className="text-[13px] text-[#9CA3AF]">Try a different search term</p>
            </div>
          )}

          {!loading && displayList.map((note, i) => (
            <button
              key={note.id}
              type="button"
              onMouseEnter={() => setActive(i)}
              onClick={() => handleSelect(note)}
              className={`w-full text-left px-[18px] py-[11px] border-b border-[rgba(209,220,232,0.4)] dark:border-white/5 flex items-center gap-3 transition-colors ${
                i === active
                  ? 'bg-[rgba(24,95,165,0.06)] dark:bg-[rgba(24,95,165,0.15)] border-l-[3px] border-l-[#185FA5]'
                  : 'bg-transparent border-l-[3px] border-l-transparent hover:bg-[rgba(24,95,165,0.03)] dark:hover:bg-white/5'
              }`}
            >
              <span className="text-[#9CA3AF] flex-shrink-0">
                {note.icon ? <span className="text-base">{note.icon}</span> : <NoteIcon />}
              </span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] truncate">
                  {note.title || 'Untitled'}
                </p>
                {note.tags?.length > 0 && (
                  <div className="flex gap-1 mt-0.5 flex-wrap">
                    {note.tags.slice(0, 3).map(tag => (
                      <span key={tag} className="text-[11px] bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.2)] text-[#185FA5] rounded-full px-1.5 py-px">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="text-[11px] text-[#9CA3AF] flex-shrink-0 whitespace-nowrap">
                {note.updated_at ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true }) : ''}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        {displayList.length > 0 && (
          <div className="px-[18px] py-2 border-t border-[rgba(209,220,232,0.4)] dark:border-white/5 flex gap-3 items-center">
            {['↑↓ navigate', '↵ open', 'esc close'].map(hint => (
              <span key={hint} className="text-[11px] text-[#9CA3AF]">{hint}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

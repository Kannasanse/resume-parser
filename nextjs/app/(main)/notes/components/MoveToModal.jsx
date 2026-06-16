'use client';
import { useState, useEffect, useRef } from 'react';

function getDescendantIds(noteId, notes) {
  const children = notes.filter(n => n.parent_id === noteId);
  return [noteId, ...children.flatMap(c => getDescendantIds(c.id, notes))];
}

export default function MoveToModal({ noteId, notes, onMove, onClose }) {
  const [search, setSearch] = useState('');
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    function handleKey(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const excluded = new Set(getDescendantIds(noteId, notes));
  const candidates = notes.filter(n => !excluded.has(n.id) && !n.is_archived);
  const filtered = search.trim()
    ? candidates.filter(n =>
        (n.title || 'Untitled').toLowerCase().includes(search.toLowerCase())
      )
    : candidates;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 dark:bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-2xl shadow-2xl w-96 max-h-[480px] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-[#D1DCE8] dark:border-white/10">
          <h3 className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] mb-2">Move to…</h3>
          <input
            ref={inputRef}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search notes…"
            className="w-full bg-[#F4F8FC] dark:bg-[#0D1830] border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#185FA5] transition-colors text-[#2C2C2A] dark:text-[#E8EFF7] placeholder-[#9CA3AF] dark:placeholder-[#4A6380]"
          />
        </div>

        {/* List */}
        <div className="overflow-y-auto flex-1 py-1">
          <button
            onClick={() => onMove(null)}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#6B7280] dark:text-[#8BA3C1] hover:bg-[#F4F8FC] dark:hover:bg-white/5 transition-colors"
          >
            <span className="text-base w-5 text-center">📁</span>
            <span>Move to root (no parent)</span>
          </button>

          {filtered.length > 0 && (
            <div className="border-t border-[#D1DCE8] dark:border-white/10 my-1" />
          )}

          {filtered.map(n => (
            <button
              key={n.id}
              onClick={() => onMove(n.id)}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-[#2C2C2A] dark:text-[#E8EFF7] hover:bg-[#F4F8FC] dark:hover:bg-white/5 transition-colors"
            >
              <span className="text-base w-5 text-center flex-shrink-0">{n.icon || '📝'}</span>
              <span className="truncate">{n.title || 'Untitled'}</span>
            </button>
          ))}

          {filtered.length === 0 && search && (
            <p className="text-xs text-[#9CA3AF] text-center py-6">No notes found</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 pb-3 pt-2 border-t border-[#D1DCE8] dark:border-white/10">
          <button
            onClick={onClose}
            className="text-xs text-[#9CA3AF] hover:text-[#6B7280] dark:hover:text-[#8BA3C1] transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

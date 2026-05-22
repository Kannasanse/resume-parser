'use client';
import { useEffect, useRef } from 'react';

export default function NoteContextMenu({ noteId, note, onAction, onClose }) {
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const btnBase =
    'w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[#2C2C2A] dark:text-[#E8EFF7] hover:bg-[#F4F8FC] dark:hover:bg-[rgba(255,255,255,0.06)] text-left transition-colors';

  return (
    <div
      ref={menuRef}
      className="absolute right-0 top-full mt-1 bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-xl shadow-xl py-1 z-50 min-w-[160px]"
    >
      <button
        onClick={() => { onAction('pin', noteId); onClose(); }}
        className={btnBase}
      >
        <span>📌</span>
        {note.is_pinned ? 'Unpin' : 'Pin to top'}
      </button>

      <button
        onClick={() => { onAction('duplicate', noteId); onClose(); }}
        className={btnBase}
      >
        <span>🔁</span>
        Duplicate
      </button>

      <button
        onClick={() => { onAction('archive', noteId); onClose(); }}
        className={btnBase}
      >
        <span>🗃</span>
        {note.is_archived ? 'Restore' : 'Archive'}
      </button>

      <div className="border-t border-[#D1DCE8] dark:border-white/10 my-1" />

      <button
        onClick={() => { onAction('delete', noteId); onClose(); }}
        className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 text-left transition-colors"
      >
        <span>🗑</span>
        Delete
      </button>
    </div>
  );
}

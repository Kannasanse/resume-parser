'use client';
import { useState } from 'react';
import NoteListItem from './NoteListItem';
import NoteContextMenu from './NoteContextMenu';

function SectionLabel({ children }) {
  return (
    <p className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-[#4A6380] select-none">
      {children}
    </p>
  );
}

export default function NotesSidebar({
  notes,
  selectedNoteId,
  onSelectNote,
  onCreateNote,
  onNoteAction,
  search,
  onSearchChange,
  loading,
}) {
  const [showArchived, setShowArchived] = useState(false);
  const [menuState, setMenuState] = useState(null); // { noteId }

  // Client-side search filter
  const filtered = search.trim()
    ? notes.filter(n =>
        (n.title || 'Untitled').toLowerCase().includes(search.toLowerCase())
      )
    : notes;

  const pinned = filtered.filter(n => n.is_pinned && !n.is_archived);
  const all = filtered.filter(n => !n.is_pinned && !n.is_archived);
  const archived = filtered.filter(n => n.is_archived);

  function handleMenuAction(action, noteId) {
    if (action === 'menu') {
      setMenuState(prev => (prev?.noteId === noteId ? null : { noteId }));
    } else {
      onNoteAction(noteId, action);
      setMenuState(null);
    }
  }

  function renderNote(note) {
    const menuNote = notes.find(n => n.id === note.id) ?? note;
    return (
      <div key={note.id} className="relative">
        <NoteListItem
          note={note}
          isSelected={selectedNoteId === note.id}
          onClick={() => { onSelectNote(note.id); setMenuState(null); }}
          onAction={handleMenuAction}
        />
        {menuState?.noteId === note.id && (
          <NoteContextMenu
            noteId={note.id}
            note={menuNote}
            onAction={(action, id) => onNoteAction(id, action)}
            onClose={() => setMenuState(null)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="w-[280px] flex-shrink-0 flex flex-col h-full bg-[#FAFBFC] dark:bg-[#0D1830] border-r border-[#D1DCE8] dark:border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-5 pb-3">
        <h2 className="text-lg font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">Notes</h2>
        <button
          onClick={onCreateNote}
          className="flex items-center gap-1 text-xs bg-[#185FA5] text-white px-3 py-1.5 rounded-[10px] font-semibold hover:bg-[#1454a0] transition-colors"
        >
          <span className="text-base leading-none">+</span> New note
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-3">
        <input
          type="text"
          value={search}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search notes..."
          className="w-full bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-lg px-3 py-2 text-sm text-[#2C2C2A] dark:text-[#E8EFF7] placeholder-[#9CA3AF] dark:placeholder-[#4A6380] outline-none focus:border-[#185FA5] transition-colors"
        />
      </div>

      {/* Note list — scrollable */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {loading ? (
          <div className="flex flex-col gap-2 px-1 pt-2">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-12 rounded-[10px] bg-[#E8EFF7] dark:bg-white/5 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            {/* Pinned section */}
            {pinned.length > 0 && (
              <>
                <SectionLabel>Pinned</SectionLabel>
                {pinned.map(renderNote)}
              </>
            )}

            {/* All notes section */}
            {all.length > 0 && (
              <>
                {pinned.length > 0 && <SectionLabel>Notes</SectionLabel>}
                {all.map(renderNote)}
              </>
            )}

            {/* Empty search result */}
            {pinned.length === 0 && all.length === 0 && !archived.length && (
              <div className="flex flex-col items-center justify-center gap-2 pt-10 text-center px-4">
                <span className="text-3xl">🔍</span>
                <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1]">
                  {search ? 'No notes match your search' : 'No notes yet'}
                </p>
              </div>
            )}

            {/* Archived section — collapsed by default */}
            {archived.length > 0 && (
              <>
                <button
                  onClick={() => setShowArchived(v => !v)}
                  className="w-full flex items-center gap-1.5 px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#6B7280] dark:hover:text-[#8BA3C1] transition-colors select-none"
                >
                  <span className={`transition-transform ${showArchived ? 'rotate-90' : ''}`}>▶</span>
                  Archived ({archived.length})
                </button>
                {showArchived && archived.map(renderNote)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import NotesSidebar from './components/NotesSidebar';
import NoteEditorPanel from './components/NoteEditorPanel';
import NotesEmptyState from './components/NotesEmptyState';
import NotesGridView from './components/NotesGridView';
import NotesListView from './components/NotesListView';
import MoveToModal from './components/MoveToModal';

// ── View/sort toggle bar ──────────────────────────────────────────────────────
function HomeToolbar({ view, onViewChange, sort, onSortChange, onCreateNote }) {
  return (
    <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-[#D1DCE8] dark:border-white/10 flex-shrink-0">
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">All notes</h1>
        <span className="text-xs text-[#9CA3AF] dark:text-[#4A6380] font-normal ml-1">Sort by</span>
        <select
          value={sort}
          onChange={e => onSortChange(e.target.value)}
          className="text-xs bg-transparent border border-[#D1DCE8] dark:border-white/10 rounded-lg px-2 py-1 text-[#6B7280] dark:text-[#8BA3C1] outline-none focus:border-[#185FA5] transition-colors cursor-pointer"
        >
          <option value="updated_at">Last edited</option>
          <option value="created_at">Date created</option>
          <option value="title">Title</option>
          <option value="word_count">Word count</option>
        </select>
      </div>
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div className="flex items-center bg-[#F4F8FC] dark:bg-[#0D1830] rounded-lg p-0.5">
          <button
            onClick={() => onViewChange('grid')}
            title="Grid view"
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              view === 'grid'
                ? 'bg-white dark:bg-[#1A2C45] text-[#185FA5] dark:text-[#5B9FD4] shadow-sm'
                : 'text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#6B7280]'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="0" y="0" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
              <rect x="7.5" y="0" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
              <rect x="0" y="7.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
              <rect x="7.5" y="7.5" width="5.5" height="5.5" rx="1.5" fill="currentColor" />
            </svg>
          </button>
          <button
            onClick={() => onViewChange('list')}
            title="List view"
            className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
              view === 'list'
                ? 'bg-white dark:bg-[#1A2C45] text-[#185FA5] dark:text-[#5B9FD4] shadow-sm'
                : 'text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#6B7280]'
            }`}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
              <rect x="0" y="1" width="13" height="2" rx="1" />
              <rect x="0" y="5.5" width="13" height="2" rx="1" />
              <rect x="0" y="10" width="13" height="2" rx="1" />
            </svg>
          </button>
        </div>
        <button
          onClick={onCreateNote}
          className="flex items-center gap-1 text-xs bg-[#185FA5] text-white px-3 py-1.5 rounded-[10px] font-semibold hover:bg-[#1454a0] transition-colors"
        >
          <span className="text-base leading-none">+</span> New note
        </button>
      </div>
    </div>
  );
}

// ── Sidebar expand button (shown when sidebar is collapsed) ────────────────────
function SidebarExpandBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      title="Expand sidebar"
      className="fixed left-0 top-1/2 -translate-y-1/2 z-30 w-5 h-12 flex items-center justify-center bg-white dark:bg-[#0D1830] border border-[#D1DCE8] dark:border-white/10 rounded-r-lg shadow-md text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#185FA5] dark:hover:text-[#5B9FD4] hover:border-[#185FA5]/30 transition-colors"
    >
      <svg width="8" height="12" viewBox="0 0 8 12" fill="none">
        <path d="M2 2L6 6L2 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────
function safeLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Sidebar collapse (persisted)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => safeLS('notes_sidebar_collapsed', false));

  // Home view mode (persisted)
  const [view, setView] = useState(() => safeLS('notes_view', 'grid'));
  const [sort, setSort] = useState(() => safeLS('notes_sort', 'updated_at'));

  // Move-to modal
  const [moveToNoteId, setMoveToNoteId] = useState(null);

  // Persist sidebar collapsed state
  useEffect(() => {
    try { localStorage.setItem('notes_sidebar_collapsed', JSON.stringify(sidebarCollapsed)); } catch {}
  }, [sidebarCollapsed]);

  // Persist view
  useEffect(() => {
    try { localStorage.setItem('notes_view', JSON.stringify(view)); } catch {}
  }, [view]);

  // Persist sort
  useEffect(() => {
    try { localStorage.setItem('notes_sort', JSON.stringify(sort)); } catch {}
  }, [sort]);

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/notes?sort=${sort}`);
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : (data.notes ?? []));
    } catch (err) {
      console.error('fetchNotes error:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [sort]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = useCallback(async (parentId = null) => {
    try {
      const res = await fetch('/api/v1/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled', parent_id: parentId }),
      });
      if (!res.ok) throw new Error('Failed to create note');
      const newNote = await res.json();
      const note = newNote.note ?? newNote;
      setNotes(prev => [{ ...note, child_count: 0 }, ...prev]);
      setSelectedNoteId(note.id);
    } catch (err) {
      console.error('handleCreateNote error:', err);
    }
  }, []);

  const handleNoteAction = useCallback(async (noteId, action) => {
    try {
      if (action === 'pin') {
        await fetch(`/api/v1/notes/${noteId}/pin`, { method: 'PATCH' });
        await fetchNotes();
      } else if (action === 'archive') {
        await fetch(`/api/v1/notes/${noteId}/archive`, { method: 'PATCH' });
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNoteId === noteId) setSelectedNoteId(null);
      } else if (action === 'duplicate') {
        const res = await fetch(`/api/v1/notes/${noteId}/duplicate`, { method: 'POST' });
        if (!res.ok) throw new Error('Duplicate failed');
        const dup = await res.json();
        const dupNote = dup.note ?? dup;
        setNotes(prev => [{ ...dupNote, child_count: 0 }, ...prev]);
        setSelectedNoteId(dupNote.id);
      } else if (action === 'delete') {
        await fetch(`/api/v1/notes/${noteId}`, { method: 'DELETE' });
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNoteId === noteId) setSelectedNoteId(null);
      } else if (action === 'addSubpage') {
        await handleCreateNote(noteId);
      } else if (action === 'moveTo') {
        setMoveToNoteId(noteId);
      }
    } catch (err) {
      console.error(`handleNoteAction(${action}) error:`, err);
    }
  }, [selectedNoteId, fetchNotes, handleCreateNote]);

  const handleMoveNote = useCallback(async (targetParentId) => {
    if (!moveToNoteId) return;
    try {
      const res = await fetch(`/api/v1/notes/${moveToNoteId}/move`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parent_id: targetParentId }),
      });
      if (!res.ok) throw new Error('Move failed');
      await fetchNotes();
    } catch (err) {
      console.error('handleMoveNote error:', err);
    } finally {
      setMoveToNoteId(null);
    }
  }, [moveToNoteId, fetchNotes]);

  const handleNoteUpdated = useCallback((updatedNote) => {
    if (!updatedNote) return;
    // Special signal from breadcrumb to navigate to a note
    if (updatedNote._selectNote !== undefined) {
      setSelectedNoteId(updatedNote._selectNote);
      return;
    }
    setNotes(prev =>
      prev.map(n => (n.id === updatedNote.id ? { ...n, ...updatedNote } : n))
    );
  }, []);

  const handleSortChange = useCallback((newSort) => {
    setSort(newSort);
  }, []);

  // Sort the notes for home view (sort is already applied via API, but handle title ascending client-side too)
  const rootNotes = notes.filter(n => !n.parent_id && !n.is_archived);

  const showHomeView = !selectedNoteId && !loading;

  return (
    <div className="flex h-full bg-white dark:bg-[#0A1628] overflow-hidden">
      {/* Sidebar — collapses to 0 width */}
      <div
        className="flex-shrink-0 transition-all duration-300 overflow-hidden"
        style={{ width: sidebarCollapsed ? 0 : 280 }}
      >
        <NotesSidebar
          notes={notes}
          selectedNoteId={selectedNoteId}
          onSelectNote={setSelectedNoteId}
          onCreateNote={() => handleCreateNote(null)}
          onNoteAction={handleNoteAction}
          search={search}
          onSearchChange={setSearch}
          loading={loading}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(v => !v)}
        />
      </div>

      {/* Expand button — shown only when sidebar is collapsed */}
      {sidebarCollapsed && <SidebarExpandBtn onClick={() => setSidebarCollapsed(false)} />}

      {/* Main content */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {selectedNoteId ? (
          <NoteEditorPanel
            key={selectedNoteId}
            noteId={selectedNoteId}
            notes={notes}
            onNoteUpdated={handleNoteUpdated}
            onCreateSubpage={(parentId) => handleNoteAction(parentId, 'addSubpage')}
          />
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="flex flex-col gap-4 w-full max-w-[720px] mx-auto px-8 py-8">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-4 bg-[#E8EFF7] dark:bg-white/5 rounded animate-pulse" style={{ width: `${70 + (i % 3) * 10}%` }} />
              ))}
            </div>
          </div>
        ) : notes.filter(n => !n.is_archived).length === 0 ? (
          <NotesEmptyState onCreateNote={() => handleCreateNote(null)} hasNotes={false} />
        ) : (
          /* Home: grid or list view */
          <div className="flex flex-col h-full overflow-hidden">
            <HomeToolbar
              view={view}
              onViewChange={setView}
              sort={sort}
              onSortChange={handleSortChange}
              onCreateNote={() => handleCreateNote(null)}
            />
            <div className="flex-1 overflow-y-auto">
              {view === 'grid' ? (
                <NotesGridView
                  notes={rootNotes}
                  selectedNoteId={selectedNoteId}
                  onSelectNote={setSelectedNoteId}
                />
              ) : (
                <NotesListView
                  notes={rootNotes}
                  selectedNoteId={selectedNoteId}
                  onSelectNote={setSelectedNoteId}
                  sort={sort}
                  onSortChange={handleSortChange}
                />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Move-to modal */}
      {moveToNoteId && (
        <MoveToModal
          noteId={moveToNoteId}
          notes={notes}
          onMove={handleMoveNote}
          onClose={() => setMoveToNoteId(null)}
        />
      )}
    </div>
  );
}

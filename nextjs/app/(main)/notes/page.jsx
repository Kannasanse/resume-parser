'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NotesSidebar from './components/NotesSidebar';
import NoteEditorPanel from './components/NoteEditorPanel';
import NotesEmptyState from './components/NotesEmptyState';

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [selectedNoteId, setSelectedNoteId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchNotes = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/v1/notes');
      if (!res.ok) throw new Error('Failed to fetch notes');
      const data = await res.json();
      setNotes(Array.isArray(data) ? data : (data.notes ?? []));
    } catch (err) {
      console.error('fetchNotes error:', err);
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled' }),
      });
      if (!res.ok) throw new Error('Failed to create note');
      const newNote = await res.json();
      const note = newNote.note ?? newNote;
      setNotes(prev => [note, ...prev]);
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
        setNotes(prev => [dupNote, ...prev]);
        setSelectedNoteId(dupNote.id);
      } else if (action === 'delete') {
        await fetch(`/api/v1/notes/${noteId}`, { method: 'DELETE' });
        setNotes(prev => prev.filter(n => n.id !== noteId));
        if (selectedNoteId === noteId) setSelectedNoteId(null);
      }
    } catch (err) {
      console.error(`handleNoteAction(${action}) error:`, err);
    }
  }, [selectedNoteId, fetchNotes]);

  const handleNoteUpdated = useCallback((updatedNote) => {
    if (!updatedNote) return;
    setNotes(prev =>
      prev.map(n => (n.id === updatedNote.id ? { ...n, ...updatedNote } : n))
    );
  }, []);

  return (
    <div className="flex h-screen bg-white dark:bg-[#0A1628] overflow-hidden">
      <NotesSidebar
        notes={notes}
        selectedNoteId={selectedNoteId}
        onSelectNote={setSelectedNoteId}
        onCreateNote={handleCreateNote}
        onNoteAction={handleNoteAction}
        search={search}
        onSearchChange={setSearch}
        loading={loading}
      />
      <div className="flex-1 overflow-hidden">
        {selectedNoteId ? (
          <NoteEditorPanel
            noteId={selectedNoteId}
            onNoteUpdated={handleNoteUpdated}
          />
        ) : (
          <NotesEmptyState
            onCreateNote={handleCreateNote}
            hasNotes={notes.length > 0}
          />
        )}
      </div>
    </div>
  );
}

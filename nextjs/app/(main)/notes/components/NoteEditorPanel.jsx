'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import BlockEditor from '@/components/editor/BlockEditor';
import EditorTitle from '@/components/editor/EditorTitle';
import EditorFooter from '@/components/editor/EditorFooter';

export default function NoteEditorPanel({ noteId, onNoteUpdated }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('idle');
  const [wordCount, setWordCount] = useState(0);

  // Refs for debounced save timers
  const titleTimerRef = useRef(null);
  const contentTimerRef = useRef(null);

  // Store the latest note data to use in retry
  const pendingPatchRef = useRef(null);

  // Fetch note whenever noteId changes
  useEffect(() => {
    if (!noteId) return;

    let cancelled = false;

    async function loadNote() {
      setLoading(true);
      setSaveState('idle');
      try {
        const res = await fetch(`/api/v1/notes/${noteId}`);
        if (!res.ok) throw new Error('Failed to fetch note');
        const data = await res.json();
        if (!cancelled) {
          const n = data.note ?? data;
          setNote(n);
          setWordCount(n.word_count ?? 0);
        }
      } catch (err) {
        console.error('loadNote error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadNote();
    return () => { cancelled = true; };
  }, [noteId]);

  // Core PATCH helper
  const patchNote = useCallback(async (payload) => {
    setSaveState('saving');
    pendingPatchRef.current = payload;
    try {
      const res = await fetch(`/api/v1/notes/${noteId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Save failed');
      const data = await res.json();
      const updated = data.note ?? data;
      setNote(prev => prev ? { ...prev, ...updated } : updated);
      onNoteUpdated?.(updated);
      setSaveState('saved');
      // Reset to idle after 2s
      setTimeout(() => setSaveState(s => (s === 'saved' ? 'idle' : s)), 2000);
    } catch (err) {
      console.error('patchNote error:', err);
      setSaveState('error');
    }
  }, [noteId, onNoteUpdated]);

  const retrySave = useCallback(() => {
    if (pendingPatchRef.current) {
      patchNote(pendingPatchRef.current);
    }
  }, [patchNote]);

  // Title change — debounced 1000ms
  const handleTitleChange = useCallback((title) => {
    setNote(prev => prev ? { ...prev, title } : prev);
    clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => {
      patchNote({ title });
    }, 1000);
  }, [patchNote]);

  // Icon change — immediate save
  const handleIconChange = useCallback((icon) => {
    setNote(prev => prev ? { ...prev, icon } : prev);
    patchNote({ icon });
  }, [patchNote]);

  // Content change — debounced 1500ms
  const handleContentChange = useCallback((content, wc) => {
    setWordCount(wc ?? 0);
    clearTimeout(contentTimerRef.current);
    contentTimerRef.current = setTimeout(() => {
      patchNote({ content, word_count: wc ?? 0 });
    }, 1500);
  }, [patchNote]);

  // Cleanup debounce timers on unmount / noteId change
  useEffect(() => {
    return () => {
      clearTimeout(titleTimerRef.current);
      clearTimeout(contentTimerRef.current);
    };
  }, [noteId]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#111F35]">
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col gap-4 w-full max-w-[720px] mx-auto px-8 py-8">
            <div className="h-10 bg-[#E8EFF7] dark:bg-white/5 rounded-lg animate-pulse w-2/3" />
            <div className="h-4 bg-[#E8EFF7] dark:bg-white/5 rounded animate-pulse w-full" />
            <div className="h-4 bg-[#E8EFF7] dark:bg-white/5 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-[#E8EFF7] dark:bg-white/5 rounded animate-pulse w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="flex flex-col h-full bg-white dark:bg-[#111F35] items-center justify-center">
        <p className="text-sm text-[#9CA3AF] dark:text-[#4A6380]">Note not found.</p>
      </div>
    );
  }

  // Only pass content to BlockEditor when it is a valid Tiptap JSON doc
  const editorContent =
    note.content && note.content.type ? note.content : null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111F35]">
      {/* Cover image */}
      {note.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={note.cover_url}
          alt=""
          className="w-full h-48 object-cover flex-shrink-0"
        />
      )}

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-[720px] mx-auto px-8 py-8">
          <EditorTitle
            value={note.title || ''}
            onChange={handleTitleChange}
            icon={note.icon}
            onIconChange={handleIconChange}
            coverUrl={note.cover_url}
            onCoverChange={(url) => patchNote({ cover_url: url })}
            onEnterPress={() => {
              // Focus is handled by BlockEditor's autoFocus; nothing extra needed
            }}
          />
          <BlockEditor
            content={editorContent}
            onChange={handleContentChange}
            placeholder="Start writing, or press '/' for commands..."
            autoFocus={false}
          />
        </div>
      </div>

      <EditorFooter
        wordCount={wordCount}
        saveState={saveState}
        onRetrySave={retrySave}
      />
    </div>
  );
}

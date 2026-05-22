'use client';
import { useState, useEffect, useRef, useCallback, Component } from 'react';
import dynamic from 'next/dynamic';
import EditorFooter from '@/components/editor/EditorFooter';
import NotesBreadcrumb from './NotesBreadcrumb';

const BlockEditor = dynamic(() => import('@/components/editor/BlockEditor'), {
  ssr: false,
  loading: () => <div className="min-h-[300px]" />,
});
const EditorTitle = dynamic(() => import('@/components/editor/EditorTitle'), { ssr: false });

class EditorErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { error: null }; }
  static getDerivedStateFromError(error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 text-sm text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg m-4">
          Editor failed to load. Please refresh the page.
          <pre className="mt-2 text-xs opacity-70 whitespace-pre-wrap">{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function NoteEditorPanel({ noteId, onNoteUpdated, notes = [], onCreateSubpage }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('idle');
  const [wordCount, setWordCount] = useState(0);

  const titleTimerRef = useRef(null);
  const contentTimerRef = useRef(null);
  const pendingPatchRef = useRef(null);

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
      setTimeout(() => setSaveState(s => (s === 'saved' ? 'idle' : s)), 2000);
    } catch (err) {
      console.error('patchNote error:', err);
      setSaveState('error');
    }
  }, [noteId, onNoteUpdated]);

  const retrySave = useCallback(() => {
    if (pendingPatchRef.current) patchNote(pendingPatchRef.current);
  }, [patchNote]);

  const handleTitleChange = useCallback((title) => {
    setNote(prev => prev ? { ...prev, title } : prev);
    clearTimeout(titleTimerRef.current);
    titleTimerRef.current = setTimeout(() => patchNote({ title }), 1000);
  }, [patchNote]);

  const handleIconChange = useCallback((icon) => {
    setNote(prev => prev ? { ...prev, icon } : prev);
    patchNote({ icon });
  }, [patchNote]);

  const handleContentChange = useCallback((content, wc) => {
    setWordCount(wc ?? 0);
    clearTimeout(contentTimerRef.current);
    contentTimerRef.current = setTimeout(() => {
      patchNote({ content, word_count: wc ?? 0 });
    }, 1500);
  }, [patchNote]);

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

  const editorContent = note.content && note.content.type ? note.content : null;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#111F35]">
      {note.cover_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={note.cover_url} alt="" className="w-full h-48 object-cover flex-shrink-0" />
      )}

      <div className="flex-1 overflow-y-auto">
        {/* Breadcrumb — only if note has a parent */}
        {note.parent_id && notes.length > 0 && (
          <NotesBreadcrumb
            note={note}
            notes={notes}
            onSelectNote={(id) => onNoteUpdated?.({ _selectNote: id })}
          />
        )}

        <div className="max-w-[720px] mx-auto px-8 py-8">
          <EditorTitle
            value={note.title || ''}
            onChange={handleTitleChange}
            icon={note.icon}
            onIconChange={handleIconChange}
            coverUrl={note.cover_url}
            onCoverChange={(url) => patchNote({ cover_url: url })}
            onEnterPress={() => {}}
          />
          <EditorErrorBoundary>
            <BlockEditor
              content={editorContent}
              onChange={handleContentChange}
              placeholder="Start writing, or press '/' for commands…"
              autoFocus={false}
              onCreateSubpage={onCreateSubpage ? () => onCreateSubpage(noteId) : undefined}
            />
          </EditorErrorBoundary>
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

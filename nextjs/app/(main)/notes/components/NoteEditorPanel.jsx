'use client';
import { useState, useEffect, useRef, useCallback, Component } from 'react';
import dynamic from 'next/dynamic';
import EditorFooter from '@/components/editor/EditorFooter';
import NotesBreadcrumb from './NotesBreadcrumb';
import FindBar from '@/components/editor/FindBar';
import NotePropertiesPanel from './NotePropertiesPanel';
import NoteSharePanel from './NoteSharePanel';
import { extractTagsFromContent } from '@/lib/notes/extractTags';

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

function ShareIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
    </svg>
  );
}

export default function NoteEditorPanel({ noteId, onNoteUpdated, notes = [], onCreateSubpage }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('idle');
  const [wordCount, setWordCount] = useState(0);
  const [findBarOpen, setFindBarOpen] = useState(false);
  const [editorInstance, setEditorInstance] = useState(null);
  const [allTagDefs, setAllTagDefs] = useState([]);
  const [shareOpen, setShareOpen] = useState(false);

  const titleTimerRef = useRef(null);
  const contentTimerRef = useRef(null);
  const pendingPatchRef = useRef(null);
  const noteTagsRef = useRef([]);

  // Keep ref in sync so content-save timeout can read latest tags without stale closure
  useEffect(() => {
    noteTagsRef.current = note?.tags ?? [];
  }, [note?.tags]);

  // Fetch tag definitions once (for autocomplete in NotePropertiesPanel)
  useEffect(() => {
    fetch('/api/v1/notes/tags')
      .then(r => r.json())
      .then(d => setAllTagDefs(Array.isArray(d.tags) ? d.tags : []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!noteId) return;
    let cancelled = false;

    async function loadNote() {
      setLoading(true);
      setSaveState('idle');
      setShareOpen(false);
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
      const inlineTags = extractTagsFromContent(content);
      const merged = [...new Set([...noteTagsRef.current, ...inlineTags])];
      patchNote({ content, word_count: wc ?? 0, tags: merged });
    }, 1500);
  }, [patchNote]);

  const handleTagsChange = useCallback((newTags) => {
    setNote(prev => prev ? { ...prev, tags: newTags } : prev);
    patchNote({ tags: newTags });
  }, [patchNote]);

  useEffect(() => {
    return () => {
      clearTimeout(titleTimerRef.current);
      clearTimeout(contentTimerRef.current);
    };
  }, [noteId]);

  // Ctrl/Cmd+F → open find bar
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        setFindBarOpen(v => !v);
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

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

      {/* Top bar: share button */}
      <div className="flex items-center justify-end px-6 py-1.5 flex-shrink-0 border-b border-[#E8EFF7] dark:border-white/10" style={{ position: 'relative' }}>
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShareOpen(v => !v)}
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:border-[#185FA5] hover:text-[#185FA5] dark:hover:text-[#5B9FD4] transition-colors"
          >
            <ShareIcon />
            Share
            {note.is_public && (
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#1D9E75', display: 'inline-block', marginLeft: 2 }} />
            )}
          </button>
          {shareOpen && (
            <NoteSharePanel
              noteId={noteId}
              initialIsPublic={note.is_public ?? false}
              initialShareToken={note.share_token ?? null}
              onClose={() => setShareOpen(false)}
            />
          )}
        </div>
      </div>

      {/* Find bar */}
      {findBarOpen && (
        <div className="flex-shrink-0 px-4 pt-2">
          <FindBar
            editor={editorInstance}
            onClose={() => setFindBarOpen(false)}
          />
        </div>
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
          <NotePropertiesPanel
            tags={note.tags ?? []}
            allTagDefs={allTagDefs}
            onChange={handleTagsChange}
          />
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
              noteId={noteId}
              onCreateSubpage={onCreateSubpage ? () => onCreateSubpage(noteId) : undefined}
              onEditorReady={setEditorInstance}
            />
          </EditorErrorBoundary>
        </div>
      </div>

      <EditorFooter
        wordCount={wordCount}
        saveState={saveState}
        onRetrySave={retrySave}
        onFindToggle={() => setFindBarOpen(v => !v)}
      />
    </div>
  );
}

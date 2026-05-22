'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import EditorFooter from '@/components/editor/EditorFooter';

// Load editor client-side only (Tiptap requires browser)
const BlockEditor = dynamic(() => import('@/components/editor/BlockEditor'), { ssr: false });
const EditorTitle = dynamic(() => import('@/components/editor/EditorTitle'), { ssr: false });

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function ExternalLinkIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
      <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
    </svg>
  );
}

export default function TopicNotesPanel({ topicId, topicTitle, onClose }) {
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saveState, setSaveState] = useState('idle');
  const [wordCount, setWordCount] = useState(0);
  const savedTimerRef = useRef(null);
  const saveTimerRef = useRef(null);
  const pendingPatchRef = useRef(null);

  useEffect(() => {
    if (!topicId) return;
    setLoading(true);
    fetch(`/api/v1/notes?context_type=topic&context_id=${topicId}`)
      .then(r => r.json())
      .then(data => {
        const existing = (data.notes || [])[0] || null;
        setNote(existing);
        if (existing) setWordCount(existing.word_count || 0);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [topicId]);

  async function createNote() {
    const res = await fetch('/api/v1/notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: topicTitle || 'Topic Notes',
        context_type: 'topic',
        context_id: topicId,
      }),
    });
    const data = await res.json();
    if (res.ok) setNote(data.note);
  }

  const scheduleSave = useCallback((payload) => {
    pendingPatchRef.current = payload;
    clearTimeout(saveTimerRef.current);
    setSaveState('saving');
    saveTimerRef.current = setTimeout(() => executeSave(payload), 1500);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function executeSave(payload) {
    if (!note?.id) return;
    setSaveState('saving');
    try {
      const res = await fetch(`/api/v1/notes/${note.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('save failed');
      setSaveState('saved');
      clearTimeout(savedTimerRef.current);
      savedTimerRef.current = setTimeout(() => setSaveState('idle'), 2000);
    } catch {
      setSaveState('error');
    }
  }

  function handleContentChange(content, wc) {
    setWordCount(wc);
    scheduleSave({ content, word_count: wc });
  }

  function handleTitleChange(title) {
    setNote(n => n ? { ...n, title } : n);
    scheduleSave({ title });
  }

  function retrySave() {
    if (pendingPatchRef.current) executeSave(pendingPatchRef.current);
  }

  useEffect(() => () => { clearTimeout(saveTimerRef.current); clearTimeout(savedTimerRef.current); }, []);

  return (
    <div className="w-[380px] flex-shrink-0 flex flex-col h-full bg-white dark:bg-[#111F35] border-l border-[#D1DCE8] dark:border-white/10">
      {/* Panel header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#D1DCE8] dark:border-white/10 flex-shrink-0">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">Topic Notes</p>
          <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] truncate">{topicTitle}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {note && (
            <Link href={`/notes/${note.id}`}
              className="flex items-center gap-1 text-xs text-[#185FA5] dark:text-[#5B9FD4] hover:underline"
              title="Open full view">
              <ExternalLinkIcon /> Full view
            </Link>
          )}
          <button onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#2C2C2A] dark:hover:text-[#E8EFF7] hover:bg-[#F4F8FC] dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors">
            <CloseIcon />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <span className="w-5 h-5 border-2 border-[#D1DCE8] dark:border-white/20 border-t-[#185FA5] dark:border-t-[#5B9FD4] rounded-full animate-spin" />
          </div>
        ) : !note ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center py-12">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-[#D1DCE8] dark:text-[rgba(255,255,255,0.20)]">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
            </svg>
            <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1]">No notes for this topic yet</p>
            <button onClick={createNote}
              className="text-sm bg-[#185FA5] text-white px-4 py-2 rounded-lg font-semibold hover:bg-[#1454a0] transition-colors">
              + Start taking notes
            </button>
          </div>
        ) : (
          <div className="px-4 py-4">
            <EditorTitle
              value={note.title || ''}
              onChange={handleTitleChange}
              icon={note.icon}
              onIconChange={(icon) => {
                setNote(n => n ? { ...n, icon } : n);
                fetch(`/api/v1/notes/${note.id}`, {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ icon }),
                });
              }}
              compact
            />
            <BlockEditor
              content={note.content && note.content.type ? note.content : null}
              onChange={handleContentChange}
              placeholder="Start taking notes..."
              autoFocus={false}
            />
          </div>
        )}
      </div>

      {note && (
        <EditorFooter wordCount={wordCount} saveState={saveState} onRetrySave={retrySave} />
      )}
    </div>
  );
}

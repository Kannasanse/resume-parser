'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

export default function FindBar({ editor, onClose }) {
  const [query, setQuery] = useState('');
  const [replaceQuery, setReplaceQuery] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [matchInfo, setMatchInfo] = useState({ count: 0, current: 0 });
  const inputRef = useRef(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  // Escape to close
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler, true);
    return () => document.removeEventListener('keydown', handler, true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshMatchInfo = useCallback((editor) => {
    if (!editor) return;
    const results = editor.storage.searchHighlight?.results ?? [];
    const idx = editor.storage.searchHighlight?.resultIndex ?? 0;
    setMatchInfo({ count: results.length, current: results.length ? idx + 1 : 0 });
  }, []);

  useEffect(() => {
    if (!editor) return;
    if (!query) {
      editor.commands.resetSearch?.();
      setMatchInfo({ count: 0, current: 0 });
      return;
    }
    editor.commands.setSearchTerm(query);
    refreshMatchInfo(editor);
  }, [query, editor, refreshMatchInfo]);

  const goNext = useCallback(() => {
    if (!editor) return;
    editor.commands.nextSearchResult();
    refreshMatchInfo(editor);
  }, [editor, refreshMatchInfo]);

  const goPrev = useCallback(() => {
    if (!editor) return;
    editor.commands.previousSearchResult();
    refreshMatchInfo(editor);
  }, [editor, refreshMatchInfo]);

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter') { e.preventDefault(); e.shiftKey ? goPrev() : goNext(); }
  };

  const handleClose = useCallback(() => {
    editor?.commands.resetSearch?.();
    onClose();
  }, [editor, onClose]);

  const handleReplace = () => {
    if (!editor) return;
    editor.commands.setReplaceTerm(replaceQuery);
    editor.commands.replace();
    editor.commands.setSearchTerm(query);
    refreshMatchInfo(editor);
  };

  const handleReplaceAll = () => {
    if (!editor || !matchInfo.count) return;
    const ok = window.confirm(
      `Replace ${matchInfo.count} occurrence${matchInfo.count !== 1 ? 's' : ''} of "${query}" with "${replaceQuery}"?`
    );
    if (!ok) return;
    editor.commands.setReplaceTerm(replaceQuery);
    editor.commands.replaceAll();
    setMatchInfo({ count: 0, current: 0 });
  };

  const btn = 'w-7 h-7 flex items-center justify-center rounded transition-colors text-[#6B7280] dark:text-[#8BA3C1] hover:bg-[rgba(24,95,165,0.08)] hover:text-[#185FA5]';

  return (
    <div
      className="flex flex-col border-b border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#1A2C45] shadow-[0_4px_12px_rgba(12,68,124,0.08)] rounded-b-xl overflow-hidden z-20"
      style={{ animation: 'findbar-slide 180ms ease' }}
    >
      <style>{`
        @keyframes findbar-slide { from { transform:translateY(-100%); opacity:0 } to { transform:translateY(0); opacity:1 } }
        .search-result { background: #FEF3C7; border-radius: 2px; }
        .dark .search-result { background: rgba(254,243,199,0.25); }
        .search-result-current { background: #F59E0B; color: white; border-radius: 2px; }
      `}</style>

      {/* Find row */}
      <div className="flex items-center h-11 px-3 gap-1.5">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#9CA3AF] flex-shrink-0">
          <circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/>
        </svg>

        <input
          ref={inputRef}
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleInputKeyDown}
          placeholder="Find in note…"
          className="flex-1 text-sm bg-transparent border-none outline-none text-[#2C2C2A] dark:text-[#E8EFF7] placeholder-[#9CA3AF] dark:placeholder-[#4A6380]"
        />

        {query && (
          <span className={`text-[11px] font-medium flex-shrink-0 mr-1 ${matchInfo.count === 0 ? 'text-[#D93025]' : 'text-[#9CA3AF] dark:text-[#4A6380]'}`}>
            {matchInfo.count === 0 ? 'No results' : `${matchInfo.current} / ${matchInfo.count}`}
          </span>
        )}

        <button onClick={goPrev} title="Previous (Shift+Enter)" className={btn}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
        </button>
        <button onClick={goNext} title="Next (Enter)" className={btn}>
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <button
          onClick={() => setShowReplace(v => !v)}
          title="Toggle replace"
          className={`w-7 h-7 flex items-center justify-center rounded text-[11px] font-bold transition-colors ${showReplace ? 'bg-[rgba(24,95,165,0.1)] text-[#185FA5]' : 'text-[#9CA3AF] hover:text-[#6B7280]'}`}
        >
          ⇄
        </button>

        <button onClick={handleClose} title="Close (Esc)" className={btn}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      {/* Replace row */}
      {showReplace && (
        <div className="flex items-center h-10 px-3 gap-2 border-t border-[#D1DCE8] dark:border-white/10">
          <div className="w-[14px]" />
          <input
            value={replaceQuery}
            onChange={e => setReplaceQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleReplace(); } }}
            placeholder="Replace with…"
            className="flex-1 text-sm bg-transparent border-none outline-none text-[#2C2C2A] dark:text-[#E8EFF7] placeholder-[#9CA3AF] dark:placeholder-[#4A6380]"
          />
          <button onClick={handleReplace} className="text-xs font-medium px-2 py-1 rounded bg-[#F4F8FC] dark:bg-[#0D1830] border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:text-[#185FA5] hover:border-[#185FA5]/30 transition-colors whitespace-nowrap">
            Replace
          </button>
          <button onClick={handleReplaceAll} className="text-xs font-medium px-2 py-1 rounded bg-[#F4F8FC] dark:bg-[#0D1830] border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:text-[#185FA5] hover:border-[#185FA5]/30 transition-colors whitespace-nowrap">
            All
          </button>
        </div>
      )}
    </div>
  );
}

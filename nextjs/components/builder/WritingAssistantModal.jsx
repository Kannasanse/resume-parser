'use client';
import { useEffect, useRef } from 'react';

function SpinnerIcon() {
  return (
    <svg className="animate-spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  );
}

function SparkleIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z"/>
      <path d="M5 17l.75 2.25L8 20l-2.25.75L5 23l-.75-2.25L2 20l2.25-.75L5 17z"/>
      <path d="M19 3l.5 1.5L21 5l-1.5.5L19 7l-.5-1.5L17 5l1.5-.5L19 3z"/>
    </svg>
  );
}

export default function WritingAssistantModal({ loading, improved, error, onAccept, onDismiss, originalHtml }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onDismiss(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px]"
      onMouseDown={e => { if (e.target === overlayRef.current) onDismiss(); }}
    >
      <div className="bg-ds-card border border-ds-border rounded-xl shadow-2xl w-full max-w-2xl mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-ds-border">
          <span className="text-primary"><SparkleIcon size={18} /></span>
          <span className="text-[14px] font-semibold text-ds-text">Writing Assistant</span>
          <button
            type="button"
            onClick={onDismiss}
            className="ml-auto w-7 h-7 flex items-center justify-center rounded-md text-ds-textMuted hover:bg-ds-bg hover:text-ds-text transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-5">
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-10 text-ds-textMuted">
              <span className="text-primary"><SpinnerIcon /></span>
              <span className="text-[13px]">Improving your content…</span>
            </div>
          )}

          {error && !loading && (
            <div className="text-[13px] text-ds-danger bg-ds-dangerLight rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {improved && !loading && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                {/* Original */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ds-textMuted">Original</div>
                  <div
                    className="border border-ds-border rounded-lg px-3 py-2.5 text-[13px] text-ds-text leading-relaxed prose-rte min-h-[80px] bg-ds-bg"
                    dangerouslySetInnerHTML={{ __html: originalHtml || '' }}
                  />
                </div>
                {/* Suggested */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">AI Suggestion</div>
                  <div
                    className="border border-primary/40 rounded-lg px-3 py-2.5 text-[13px] text-ds-text leading-relaxed prose-rte min-h-[80px] bg-primary/[0.03]"
                    dangerouslySetInnerHTML={{ __html: improved }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!loading && (
          <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-ds-border bg-ds-bg">
            <button
              type="button"
              onClick={onDismiss}
              className="h-8 px-4 text-[13px] font-semibold rounded-lg border border-ds-border text-ds-text hover:bg-ds-bg transition-colors"
            >
              Dismiss
            </button>
            {improved && (
              <button
                type="button"
                onClick={onAccept}
                className="h-8 px-4 text-[13px] font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <SparkleIcon size={13} />
                Use this suggestion
              </button>
            )}
          </div>
        )}
      </div>

      <style>{`
        .prose-rte ul { list-style-type: disc; padding-left: 1.25em; margin: 0.25em 0; }
        .prose-rte ol { list-style-type: decimal; padding-left: 1.25em; margin: 0.25em 0; }
        .prose-rte li { display: list-item; }
        .prose-rte p { margin: 0; }
        .prose-rte p + p { margin-top: 0.25em; }
      `}</style>
    </div>
  );
}

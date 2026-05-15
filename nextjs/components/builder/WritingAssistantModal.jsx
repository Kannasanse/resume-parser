'use client';
import { useEffect, useRef, useState } from 'react';

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

const QUICK_SUGGESTIONS = [
  'Make it shorter',
  'Make it longer',
  'Use stronger action verbs',
  'Add more quantifiable results',
  'Make it more formal',
];

export default function WritingAssistantModal({
  loading,
  improved,
  error,
  onAccept,
  onDismiss,
  onImprove,
  originalHtml,
}) {
  const overlayRef = useRef(null);
  const [feedback, setFeedback] = useState('');

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onDismiss(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onDismiss]);

  const handleImprove = () => onImprove(feedback.trim());

  const isInsufficientCredits = error?.includes('Insufficient credits') || error?.includes('insufficient_credits');

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4"
      onMouseDown={e => { if (e.target === overlayRef.current) onDismiss(); }}
    >
      {/* Modal — fixed height, flex column so header/footer are sticky */}
      <div
        className="bg-ds-card border border-ds-border rounded-xl shadow-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: 'min(85vh, 680px)' }}
      >
        {/* Header — fixed */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-ds-border flex-shrink-0">
          <span className="text-primary"><SparkleIcon size={18} /></span>
          <span className="text-[14px] font-semibold text-ds-text">Writing Assistant</span>
          <span className="ml-1 text-[11px] text-ds-textMuted font-normal">· 1 credit</span>
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

        {/* Body — scrollable */}
        <div className="flex-1 overflow-y-auto p-5 min-h-0 flex flex-col gap-4">

          {/* Feedback input — always visible */}
          {!loading && (
            <div className="flex flex-col gap-2 flex-shrink-0">
              <label className="text-[12px] font-semibold text-ds-text">
                Additional instructions <span className="font-normal text-ds-textMuted">(optional)</span>
              </label>
              <textarea
                rows={2}
                value={feedback}
                onChange={e => setFeedback(e.target.value)}
                placeholder="e.g. Make it shorter, focus on leadership, add more metrics…"
                className="w-full px-3 py-2 text-[13px] border border-ds-inputBorder rounded-lg bg-ds-card text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/10 transition-colors resize-none leading-relaxed"
              />
              {/* Quick suggestion chips */}
              <div className="flex flex-wrap gap-1.5">
                {QUICK_SUGGESTIONS.map(s => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setFeedback(s)}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-full border transition-colors ${
                      feedback === s
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-ds-border text-ds-textMuted hover:border-primary hover:text-primary hover:bg-primary/5'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-ds-textMuted flex-1">
              <span className="text-primary"><SpinnerIcon /></span>
              <span className="text-[13px]">Improving your content…</span>
            </div>
          )}

          {/* Error */}
          {error && !loading && (
            <div className={`text-[13px] rounded-lg px-4 py-3 flex-shrink-0 ${
              isInsufficientCredits
                ? 'text-amber-700 bg-amber-50 border border-amber-200'
                : 'text-ds-danger bg-ds-dangerLight'
            }`}>
              {isInsufficientCredits
                ? <>You don't have enough credits. <a href="/credits" className="underline font-semibold">Get more credits →</a></>
                : error
              }
            </div>
          )}

          {/* Side-by-side comparison */}
          {improved && !loading && (
            <div className="grid grid-cols-2 gap-3 flex-shrink-0">
              {/* Original */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ds-textMuted">Original</div>
                <div
                  className="border border-ds-border rounded-lg px-3 py-2.5 text-[13px] text-ds-text leading-relaxed prose-rte bg-ds-bg"
                  dangerouslySetInnerHTML={{ __html: originalHtml || '' }}
                />
              </div>
              {/* Suggested */}
              <div className="flex flex-col gap-1.5">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">AI Suggestion</div>
                <div
                  className="border border-primary/40 rounded-lg px-3 py-2.5 text-[13px] text-ds-text leading-relaxed prose-rte bg-primary/[0.03]"
                  dangerouslySetInnerHTML={{ __html: improved }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer — fixed */}
        {!loading && (
          <div className="flex justify-end gap-2 px-5 py-3.5 border-t border-ds-border bg-ds-bg flex-shrink-0">
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
                onClick={() => handleImprove()}
                className="h-8 px-4 text-[13px] font-semibold rounded-lg border border-ds-border text-ds-text hover:bg-ds-bg transition-colors flex items-center gap-1.5"
              >
                <SparkleIcon size={12} />
                Try again
              </button>
            )}
            {!improved && !error && (
              <button
                type="button"
                onClick={handleImprove}
                className="h-8 px-4 text-[13px] font-semibold rounded-lg bg-primary text-white hover:bg-primary/90 transition-colors flex items-center gap-1.5"
              >
                <SparkleIcon size={13} />
                Improve · 1 credit
              </button>
            )}
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

'use client';
import { useEffect, useRef } from 'react';

function OptionCard({ icon, title, description, selected, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left rounded-xl border-2 p-4 transition-all duration-150 focus:outline-none ${
        selected
          ? 'border-[#185FA5] bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.18)]'
          : 'border-[var(--c-border)] bg-[var(--c-surface)] hover:border-[#185FA5]/50'
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          selected ? 'bg-[#185FA5] text-white' : 'bg-[var(--c-bg)] text-[var(--c-text-muted)]'
        }`}>
          {icon}
        </div>
        <div className="min-w-0">
          <p className={`text-sm font-semibold ${selected ? 'text-[#185FA5] dark:text-[#5B9FD4]' : 'text-[var(--c-text)]'}`}>
            {title}
          </p>
          <p className="text-xs text-[var(--c-text-muted)] mt-0.5 leading-relaxed">{description}</p>
        </div>
        <div className={`flex-shrink-0 mt-0.5 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
          selected ? 'border-[#185FA5] bg-[#185FA5]' : 'border-[var(--c-border)]'
        }`}>
          {selected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
        </div>
      </div>
    </button>
  );
}

export default function ContentSourceModal({ source, onChangeSource, onConfirm, onClose }) {
  const overlayRef = useRef(null);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="bg-[var(--c-surface)] rounded-2xl shadow-2xl border border-[var(--c-border)] w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-[var(--c-border)]">
          <div>
            <h3 className="text-base font-bold text-[var(--c-text)] tracking-[-0.02em]">Generate content</h3>
            <p className="text-xs text-[var(--c-text-muted)] mt-0.5">Choose how to generate this section</p>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors p-1 rounded-lg hover:bg-[var(--c-bg)]"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Options */}
        <div className="p-5 space-y-3">
          <OptionCard
            selected={source === 'web'}
            onClick={() => onChangeSource('web')}
            title="Web Search"
            description="Pull content from authoritative sources like MDN, freeCodeCamp, and dev.to — then summarise with AI."
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            }
          />
          <OptionCard
            selected={source === 'ai'}
            onClick={() => onChangeSource('ai')}
            title="AI Generated"
            description="Original content written by AI, tailored to your skill level and learning style."
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
              </svg>
            }
          />
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[var(--c-border)] text-sm font-medium text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:bg-[var(--c-bg)] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(source)}
            className="flex-1 py-2.5 rounded-xl bg-[#185FA5] text-white text-sm font-semibold hover:bg-[#1450a3] transition-colors"
          >
            Generate
          </button>
        </div>
      </div>
    </div>
  );
}

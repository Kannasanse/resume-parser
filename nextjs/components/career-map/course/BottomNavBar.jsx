'use client';

export default function BottomNavBar({ currentIndex, total, onPrev, onNext, onComplete }) {
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;

  return (
    <div className="fixed bottom-0 left-0 right-0 glass-light border-t border-[rgba(209,220,232,0.6)] shadow-[0_-4px_16px_rgba(12,68,124,0.06)] h-16 flex items-center justify-between px-6 z-20">
      <button
        onClick={onPrev}
        disabled={isFirst}
        className="flex items-center gap-1.5 text-sm border border-[var(--c-border)] px-4 py-2 rounded-lg disabled:opacity-30 hover:border-[var(--c-primary)] transition-colors"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        Previous section
      </button>

      <span className="text-sm text-[var(--c-text-muted)]">Section {currentIndex + 1} of {total}</span>

      {isLast ? (
        <button
          onClick={onComplete}
          className="btn-primary animate-pulse-glow text-sm font-medium px-5 py-2 rounded-lg flex items-center gap-1.5"
        >
          Mark topic complete ✓
        </button>
      ) : (
        <button
          onClick={onNext}
          className="bg-[var(--c-primary)] text-white text-sm font-medium px-5 py-2 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors flex items-center gap-1.5"
        >
          Next section
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
        </button>
      )}
    </div>
  );
}

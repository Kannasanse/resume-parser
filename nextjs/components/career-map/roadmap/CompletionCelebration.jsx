'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function CompletionCelebration({ topic, nextTopic, studyPlanId, onClose }) {
  const [countdown, setCountdown] = useState(100);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(p => {
        if (p <= 0) { clearInterval(interval); onClose(); return 0; }
        return p - (100 / 30); // 3 seconds = 30 ticks at ~100ms
      });
    }, 100);
    return () => clearInterval(interval);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xs p-8 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h3 className="text-xl font-bold text-[var(--c-text)]">Topic completed!</h3>
        <p className="text-sm text-[var(--c-text-muted)] mt-1">You've finished '{topic.title}'</p>

        <div className="flex items-center justify-center gap-6 mt-4">
          <span className="text-sm text-[var(--c-success)]">✓ {(topic.sections || []).length} sections read</span>
        </div>

        {nextTopic && (
          <>
            <div className="border-t border-[var(--c-border)] my-4" />
            <p className="text-xs text-[var(--c-text-muted)] mb-1">Up next:</p>
            <p className="text-sm font-semibold text-[var(--c-text)] mb-3">{nextTopic.title}</p>
            <Link
              href={`/career-map/study-plan/${studyPlanId}/topic/${nextTopic.id}`}
              className="block w-full bg-[var(--c-primary)] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors"
            >
              Start next topic →
            </Link>
          </>
        )}

        <div className="mt-4 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-[var(--c-primary)] rounded-full transition-all duration-100" style={{ width: `${countdown}%` }} />
        </div>
      </div>
    </div>
  );
}

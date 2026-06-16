'use client';
import { useState } from 'react';

export default function GenerateTopicButton({ topicId, currentLevel, learningStyle, onDone, type }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isExercise = type === 'exercise';
  const label = isExercise ? 'Generate exercises' : 'Generate summary';
  const loadingLabel = isExercise ? 'Generating exercises…' : 'Generating summary…';
  const route = isExercise ? '/api/v1/career-map/generate-exercises' : '/api/v1/career-map/generate-summary';

  async function handleClick() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(route, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicId, currentLevel, learningStyle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Generation failed');
      if (onDone) onDone(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const color = isExercise
    ? 'border-amber-300 text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20'
    : 'border-[#1D9E75]/40 text-[#1D9E75] hover:bg-[#F0FDF4] dark:hover:bg-[rgba(29,158,117,0.08)]';

  return (
    <div className="space-y-1">
      <button
        onClick={handleClick}
        disabled={loading}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-medium transition-colors disabled:opacity-60 ${color}`}
      >
        {loading ? (
          <>
            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4"/>
            </svg>
            {loadingLabel}
          </>
        ) : (
          <>
            {isExercise ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/>
              </svg>
            )}
            {label}
          </>
        )}
      </button>
      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  );
}

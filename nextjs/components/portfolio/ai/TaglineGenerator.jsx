'use client';

import { useState } from 'react';
import AIButton from './AIButton';

const TONES = ['Professional', 'Creative', 'Technical', 'Friendly'];

export default function TaglineGenerator({ portfolioData, onAccept }) {
  const [tone, setTone] = useState('Professional');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);
  const [usageError, setUsageError] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const res = await fetch('/api/v1/portfolios/ai/tagline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tone,
          name: portfolioData?.name,
          title: portfolioData?.title,
          skills: portfolioData?.skills,
        }),
      });

      const data = await res.json();

      if (res.status === 429 || data?.limitExceeded) {
        setUsageError(true);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? 'Failed to generate taglines');

      const taglines = Array.isArray(data.taglines) ? data.taglines : [data.tagline ?? data.result].filter(Boolean);
      setResults(taglines.slice(0, 5));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Tone selector */}
      <div>
        <span className="text-xs font-medium text-ds-textMuted block mb-1.5">Tone</span>
        <div className="flex flex-wrap gap-1.5">
          {TONES.map((t) => (
            <button
              key={t}
              onClick={() => setTone(t)}
              className={`px-3 py-1 text-xs font-medium rounded border transition-colors ${
                tone === t
                  ? 'bg-[#185FA5] text-white border-[#185FA5]'
                  : 'border-ds-border text-ds-textMuted hover:border-[#185FA5] hover:text-[#185FA5]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <AIButton
        label="Generate taglines"
        onGenerate={handleGenerate}
        loading={loading}
        usageError={usageError ? "You've used all 5 AI generations this month." : null}
      />

      {error && (
        <div className="text-xs text-ds-danger bg-ds-dangerLight border border-ds-danger/20 rounded p-2.5">
          {error}
        </div>
      )}

      {results.length > 0 && (
        <div className="bg-ds-bg border border-ds-border rounded-lg mt-3 divide-y divide-ds-border overflow-hidden">
          {results.map((tagline, i) => (
            <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm text-ds-text flex-1">{tagline}</span>
              <button
                onClick={() => onAccept(tagline)}
                className="shrink-0 px-2.5 py-1 text-xs font-medium rounded bg-[#185FA5] text-white hover:bg-[#154f8a] transition-colors"
              >
                Use this
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

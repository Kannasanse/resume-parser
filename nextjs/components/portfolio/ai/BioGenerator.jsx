'use client';

import { useState } from 'react';
import AIButton from './AIButton';

export default function BioGenerator({ portfolioData, onAccept }) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [usageError, setUsageError] = useState(null);

  async function handleGenerate() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/v1/portfolios/ai/bio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: portfolioData?.name,
          title: portfolioData?.title,
          skills: portfolioData?.skills,
          experience: portfolioData?.experience,
          summary: portfolioData?.summary,
        }),
      });

      const data = await res.json();

      if (res.status === 429 || data?.limitExceeded) {
        setUsageError(true);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? 'Failed to generate bio');

      setResult(data.bio ?? data.result ?? data.text);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <AIButton
        label="Generate bio with AI"
        onGenerate={handleGenerate}
        loading={loading}
        usageError={usageError ? "You've used all 5 AI generations this month." : null}
      />

      {error && (
        <div className="text-xs text-ds-danger bg-ds-dangerLight border border-ds-danger/20 rounded p-2.5">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-ds-bg border border-ds-border rounded-lg p-4 text-sm text-ds-text mt-3 space-y-3">
          <p className="leading-relaxed whitespace-pre-wrap">{result}</p>
          <div className="flex items-center gap-2 pt-1 border-t border-ds-border">
            <button
              onClick={() => onAccept(result)}
              className="px-3 py-1.5 text-xs font-medium rounded bg-[#185FA5] text-white hover:bg-[#154f8a] transition-colors"
            >
              Accept
            </button>
            <button
              onClick={handleGenerate}
              disabled={loading}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded border border-[#185FA5] text-[#185FA5] hover:bg-blue-50 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <span className="w-3 h-3 border-2 border-[#185FA5] border-t-transparent rounded-full animate-spin inline-block" />
                  Generating...
                </>
              ) : (
                'Regenerate'
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

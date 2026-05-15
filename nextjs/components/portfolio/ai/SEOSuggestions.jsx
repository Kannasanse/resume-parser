'use client';

import { useState } from 'react';
import AIButton from './AIButton';

const TITLE_MAX = 60;
const DESC_MAX = 160;

function CharCount({ value, max }) {
  const count = value?.length ?? 0;
  const over = count > max;
  return (
    <span className={`text-[10px] tabular-nums ${over ? 'text-ds-danger' : 'text-ds-textMuted'}`}>
      {count}/{max}
    </span>
  );
}

export default function SEOSuggestions({ portfolioData, onAccept }) {
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);
  const [error, setError] = useState(null);
  const [usageError, setUsageError] = useState(null);

  async function handleSuggest() {
    setLoading(true);
    setError(null);
    setSuggestions(null);

    try {
      const res = await fetch('/api/v1/portfolios/ai/seo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: portfolioData?.name,
          title: portfolioData?.title,
          skills: portfolioData?.skills,
          summary: portfolioData?.summary,
          slug: portfolioData?.slug,
        }),
      });

      const data = await res.json();

      if (res.status === 429 || data?.limitExceeded) {
        setUsageError(true);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? 'Failed to generate SEO suggestions');

      setSuggestions({
        metaTitle: data.metaTitle ?? data.title ?? '',
        metaDescription: data.metaDescription ?? data.description ?? '',
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      <AIButton
        label="Suggest with AI"
        onGenerate={handleSuggest}
        loading={loading}
        usageError={usageError ? "You've used all 5 AI generations this month." : null}
      />

      {error && (
        <div className="text-xs text-ds-danger bg-ds-dangerLight border border-ds-danger/20 rounded p-2.5">
          {error}
        </div>
      )}

      {suggestions && (
        <div className="space-y-3 mt-2">
          {/* Title suggestion */}
          <div className="bg-ds-bg border border-ds-border rounded-lg p-4 text-sm text-ds-text">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Suggested title</span>
              <CharCount value={suggestions.metaTitle} max={TITLE_MAX} />
            </div>
            <p className="text-ds-text mb-3 leading-relaxed">{suggestions.metaTitle}</p>
            <button
              onClick={() => onAccept({ metaTitle: suggestions.metaTitle })}
              className="px-3 py-1.5 text-xs font-medium rounded bg-[#185FA5] text-white hover:bg-[#154f8a] transition-colors"
            >
              Use this
            </button>
          </div>

          {/* Description suggestion */}
          <div className="bg-ds-bg border border-ds-border rounded-lg p-4 text-sm text-ds-text">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">Suggested description</span>
              <CharCount value={suggestions.metaDescription} max={DESC_MAX} />
            </div>
            <p className="text-ds-text mb-3 leading-relaxed">{suggestions.metaDescription}</p>
            <button
              onClick={() => onAccept({ metaDescription: suggestions.metaDescription })}
              className="px-3 py-1.5 text-xs font-medium rounded bg-[#185FA5] text-white hover:bg-[#154f8a] transition-colors"
            >
              Use this
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

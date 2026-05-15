'use client';

import { useState } from 'react';
import AIButton from './AIButton';

const IMPORTANCE_STYLES = {
  High: 'bg-ds-dangerLight text-ds-danger',
  Medium: 'bg-amber-50 text-amber-700',
};

function ResultsModal({ results, onAddSkill, onClose }) {
  const highPrioritySkills = results.missingSkills?.filter((s) => s.importance === 'High') ?? [];

  function handleAddAll() {
    highPrioritySkills.forEach((s) => onAddSkill(s.skill));
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-ds-card border border-ds-border rounded-xl p-6 shadow-xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-ds-text">Skills Gap Analysis</h3>
          <button
            onClick={onClose}
            className="text-ds-textMuted hover:text-ds-text transition-colors p-1"
            aria-label="Close"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="4" y1="4" x2="14" y2="14" /><line x1="14" y1="4" x2="4" y2="14" />
            </svg>
          </button>
        </div>

        {/* Summary */}
        {results.summary && (
          <div className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-2.5 rounded mb-4">
            {results.summary}
          </div>
        )}

        {/* Skills list */}
        <div className="flex-1 overflow-y-auto space-y-2 mb-4">
          {(results.missingSkills ?? []).map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-3 bg-ds-bg border border-ds-border rounded-lg px-3 py-2.5"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-semibold text-ds-text">{item.skill}</span>
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${IMPORTANCE_STYLES[item.importance] ?? 'bg-ds-bg text-ds-textMuted'}`}>
                    {item.importance}
                  </span>
                </div>
                {item.reason && (
                  <p className="text-xs text-ds-textMuted leading-relaxed">{item.reason}</p>
                )}
              </div>
              <button
                onClick={() => onAddSkill(item.skill)}
                className="shrink-0 px-2.5 py-1 text-xs font-medium rounded border border-[#185FA5] text-[#185FA5] hover:bg-blue-50 transition-colors whitespace-nowrap"
              >
                Add to my skills
              </button>
            </div>
          ))}
          {(!results.missingSkills || results.missingSkills.length === 0) && (
            <p className="text-sm text-ds-textMuted text-center py-6 italic">No skill gaps identified.</p>
          )}
        </div>

        {/* Add all high-priority */}
        {highPrioritySkills.length > 0 && (
          <button
            onClick={handleAddAll}
            className="w-full py-2 text-sm font-medium rounded-lg bg-[#185FA5] text-white hover:bg-[#154f8a] transition-colors"
          >
            Add all high-priority skills ({highPrioritySkills.length})
          </button>
        )}
      </div>
    </div>
  );
}

export default function SkillsGapAnalysis({ currentSkills, projectKeywords, onAddSkill }) {
  const [targetRole, setTargetRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [usageError, setUsageError] = useState(null);
  const [showModal, setShowModal] = useState(false);

  async function handleAnalyse() {
    if (!targetRole.trim()) return;

    setLoading(true);
    setError(null);
    setResults(null);

    try {
      const res = await fetch('/api/v1/portfolios/ai/skills-gap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          currentSkills,
          projectKeywords,
        }),
      });

      const data = await res.json();

      if (res.status === 429 || data?.limitExceeded) {
        setUsageError(true);
        return;
      }
      if (!res.ok) throw new Error(data?.error ?? 'Analysis failed');

      setResults(data);
      setShowModal(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-3">
      {/* Target role input */}
      <div>
        <label className="text-xs font-medium text-ds-textMuted block mb-1.5">
          Target role <span className="text-ds-danger">*</span>
        </label>
        <input
          type="text"
          value={targetRole}
          onChange={(e) => setTargetRole(e.target.value)}
          placeholder="e.g. Senior Frontend Engineer"
          className="w-full px-3 py-2 text-sm bg-ds-bg border border-ds-border rounded-lg text-ds-text placeholder:text-ds-textMuted focus:outline-none focus:border-[#185FA5] transition-colors"
        />
      </div>

      <AIButton
        label="Analyse skills gap"
        onGenerate={handleAnalyse}
        disabled={!targetRole.trim()}
        loading={loading}
        usageError={usageError ? "You've used all 5 AI generations this month." : null}
      />

      {error && (
        <div className="text-xs text-ds-danger bg-ds-dangerLight border border-ds-danger/20 rounded p-2.5">
          {error}
        </div>
      )}

      {showModal && results && (
        <ResultsModal
          results={results}
          onAddSkill={(skill) => { onAddSkill?.(skill); }}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}

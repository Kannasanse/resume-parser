'use client';
import { useState } from 'react';

export default function ResumeAnalysisLoader({ resumes, onAnalyse }) {
  const [selectedId, setSelectedId] = useState(resumes[0]?.id || '');
  const [loading, setLoading] = useState(false);

  async function handleStart() {
    setLoading(true);
    await onAnalyse(selectedId || null);
    setLoading(false);
  }

  return (
    <div className="ds-card p-8 text-center space-y-6">
      <div className="stat-icon mx-auto">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 20H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v2"/>
          <path d="M9 12h6M9 16h4"/>
          <circle cx="17" cy="17" r="4"/>
          <path d="M19 15l-2 2-1-1"/>
        </svg>
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[var(--c-text)]">Analyse your resume</h2>
        <p className="text-sm text-[var(--c-text-muted)] mt-1">
          We'll extract your skills and experience to build a personalised career map.
        </p>
      </div>

      {resumes.length > 0 ? (
        <div className="space-y-3 text-left">
          <label className="block text-sm font-medium text-[var(--c-text)]">Select a resume</label>
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full border border-[var(--c-border)] rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--c-primary-light)]"
          >
            {resumes.map(r => (
              <option key={r.id} value={r.id}>
                {r.file_name || 'Resume'} — {new Date(r.created_at).toLocaleDateString()}
              </option>
            ))}
          </select>
        </div>
      ) : (
        <div className="ds-alert ds-alert-warning text-left">
          No resumes found. We'll build a generic profile — you can upload a resume later from the Resume page.
        </div>
      )}

      <button
        onClick={handleStart}
        disabled={loading}
        className="w-full bg-[var(--c-primary)] text-white font-medium py-2.5 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50"
      >
        {loading ? 'Analysing…' : 'Start Career Map →'}
      </button>
    </div>
  );
}

'use client';
import { useState } from 'react';

const TABS = ['Overview', 'Skills', 'Actions'];

function salaryRange(min, max) {
  if (!min && !max) return 'N/A';
  return `$${Math.round(min / 1000)}k – $${Math.round(max / 1000)}k`;
}

export default function NodeDetailPanel({ node, sessionId, onClose, onViewRoadmap }) {
  const [tab, setTab] = useState('Overview');
  const d = node.data || {};

  return (
    <div className="absolute bottom-4 left-4 w-80 bg-white dark:bg-[#111F35] border border-[var(--c-border)] rounded-xl shadow-xl z-10 overflow-hidden">
      {/* Header */}
      <div className="bg-[var(--c-primary)] px-4 py-3 flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-white">{d.title}</p>
          <p className="text-xs text-blue-200 mt-0.5">{d.seniority} · {d.category}</p>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white ml-2 flex-shrink-0">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--c-border)]">
        {TABS.map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 text-xs font-medium py-2.5 transition-colors ${tab === t ? 'text-[var(--c-primary)] border-b-2 border-[var(--c-primary)]' : 'text-[var(--c-text-muted)] hover:text-[var(--c-text)]'}`}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="p-4">
        {tab === 'Overview' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[var(--c-text-muted)]">Salary range</span>
              <span className="font-medium text-[var(--c-text)]">{salaryRange(d.salary_min_usd, d.salary_max_usd)}</span>
            </div>
            {d.skill_match !== undefined && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-[var(--c-text-muted)]">Your skill match</span>
                <span className={`font-semibold ${d.skill_match >= 70 ? 'text-[var(--c-success)]' : d.skill_match >= 40 ? 'text-yellow-600' : 'text-red-500'}`}>
                  {d.skill_match}%
                </span>
              </div>
            )}
          </div>
        )}

        {tab === 'Skills' && (
          <div className="space-y-2">
            <p className="text-xs text-[var(--c-text-muted)]">Required skills for this role</p>
            <div className="flex flex-wrap gap-1.5">
              {(d.required_skills || []).length > 0
                ? (d.required_skills || []).map(s => (
                    <span key={s} className="text-xs bg-[var(--c-primary-light)] text-[var(--c-primary)] px-2 py-0.5 rounded-full">{s}</span>
                  ))
                : <p className="text-sm text-[var(--c-text-muted)]">No skill data available</p>
              }
            </div>
          </div>
        )}

        {tab === 'Actions' && (
          <div className="space-y-2">
            <button
              onClick={() => onViewRoadmap(d.id)}
              className="w-full text-sm bg-[var(--c-primary)] text-white font-medium py-2 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors"
            >
              Learning Roadmap
            </button>
            <button
              onClick={onClose}
              className="w-full text-sm border border-[var(--c-border)] text-[var(--c-text)] font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-[rgba(255,255,255,0.06)] transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

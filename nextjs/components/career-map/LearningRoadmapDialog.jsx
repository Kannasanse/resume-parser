'use client';
import { useState, useEffect } from 'react';

const RESOURCE_ICONS = {
  course: '🎓',
  book: '📖',
  practice: '💻',
  project: '🚀',
};

export default function LearningRoadmapDialog({ sessionId, roleId, onClose }) {
  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('/api/v1/career-map/learning-roadmap', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, role_id: roleId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        setRoadmap(data.roadmap);
      } catch (e) {
        setError(e.message || 'Failed to load roadmap');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sessionId, roleId]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white dark:bg-[#111F35] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--c-border)]">
          <div>
            <h2 className="text-base font-semibold text-[var(--c-text)]">Learning Roadmap</h2>
            {roadmap && <p className="text-xs text-[var(--c-text-muted)] mt-0.5">{roadmap.target_role} · ~{roadmap.estimated_months} months</p>}
          </div>
          <button onClick={onClose} className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {loading && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="ds-skel h-24 rounded-xl" />
              ))}
              <p className="text-sm text-center text-[var(--c-text-muted)]">Generating your personalised roadmap…</p>
            </div>
          )}

          {error && <div className="ds-alert ds-alert-error">{error}</div>}

          {roadmap && !loading && (
            <>
              {roadmap.quick_wins?.length > 0 && (
                <div className="bg-[var(--c-primary-light)] rounded-xl p-4">
                  <p className="text-sm font-semibold text-[var(--c-primary)] mb-2">⚡ Quick wins this week</p>
                  <ul className="space-y-1">
                    {roadmap.quick_wins.map((w, i) => (
                      <li key={i} className="text-sm text-[var(--c-text)] flex items-start gap-2">
                        <span className="text-[var(--c-primary)] font-bold mt-0.5">·</span>{w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {roadmap.phases?.map(phase => (
                <div key={phase.phase} className="ds-card p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="stat-icon" style={{ width: 28, height: 28, borderRadius: 6, fontSize: 12, fontWeight: 700 }}>
                          {phase.phase}
                        </span>
                        <p className="font-semibold text-sm text-[var(--c-text)]">{phase.title}</p>
                      </div>
                    </div>
                    <span className="text-xs text-[var(--c-text-muted)] flex-shrink-0">{phase.duration_weeks}w</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(phase.focus_skills || []).map(s => (
                      <span key={s} className="text-xs bg-[var(--c-primary-light)] text-[var(--c-primary)] px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>

                  {phase.resources?.length > 0 && (
                    <div className="space-y-1.5">
                      {phase.resources.map((r, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <span>{RESOURCE_ICONS[r.type] || '📌'}</span>
                          <span className="text-[var(--c-text)]">{r.title}</span>
                          {r.url_hint && <span className="text-[var(--c-text-muted)] text-xs">({r.url_hint})</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {phase.milestone && (
                    <div className="bg-[var(--c-success-bg)] rounded-lg px-3 py-2 text-xs text-[var(--c-success)]">
                      ✓ Milestone: {phase.milestone}
                    </div>
                  )}
                </div>
              ))}

              {roadmap.job_readiness_tips?.length > 0 && (
                <div className="ds-card p-4">
                  <p className="text-sm font-semibold text-[var(--c-text)] mb-2">Job readiness tips</p>
                  <ul className="space-y-1.5">
                    {roadmap.job_readiness_tips.map((t, i) => (
                      <li key={i} className="text-sm text-[var(--c-text-muted)] flex items-start gap-2">
                        <span className="text-[var(--c-primary)] font-bold mt-0.5">→</span>{t}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[var(--c-border)]">
          <button
            onClick={onClose}
            className="w-full border border-[var(--c-border)] text-[var(--c-text)] text-sm font-medium py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

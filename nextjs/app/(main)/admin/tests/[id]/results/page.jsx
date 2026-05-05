'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';

const INTEGRITY_LABELS = {
  tab_switch:      { label: 'Tab switch',      color: 'text-red-600 bg-red-50 border-red-200' },
  copy_attempt:    { label: 'Copy attempt',    color: 'text-orange-600 bg-orange-50 border-orange-200' },
  paste_attempt:   { label: 'Paste attempt',   color: 'text-orange-600 bg-orange-50 border-orange-200' },
  right_click:     { label: 'Right-click',     color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  focus_lost:      { label: 'Focus lost',      color: 'text-gray-600 bg-gray-50 border-gray-200' },
};

function IntegrityBadges({ summary }) {
  const keys = Object.keys(summary).filter(k => summary[k] > 0 && INTEGRITY_LABELS[k]);
  if (!keys.length) return <span className="text-xs text-ds-success">Clean</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {keys.map(k => (
        <span key={k} className={`text-xs px-1.5 py-0.5 rounded border font-medium ${INTEGRITY_LABELS[k]?.color}`}>
          {summary[k]}× {INTEGRITY_LABELS[k]?.label}
        </span>
      ))}
    </div>
  );
}

export default function TestResults() {
  const { id } = useParams();
  const [testTitle, setTestTitle] = useState('');
  const [attempts, setAttempts]   = useState([]);
  const [total, setTotal]         = useState(0);
  const [loading, setLoading]     = useState(true);
  const [page, setPage]           = useState(1);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [testRes, attRes] = await Promise.all([
        fetch(`/api/v1/admin/tests/${id}`),
        fetch(`/api/v1/admin/tests/${id}/attempts?page=${page}&limit=${limit}`),
      ]);
      const [testData, attData] = await Promise.all([testRes.json(), attRes.json()]);
      setTestTitle(testData.test?.title || '');
      setAttempts(attData.attempts || []);
      setTotal(attData.total || 0);
    } finally {
      setLoading(false);
    }
  }, [id, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href={`/admin/tests/${id}`} className="text-ds-textMuted hover:text-ds-text transition-colors mt-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ds-text font-heading">
              {testTitle ? `${testTitle} — Results` : 'Test Results'}
            </h1>
            <p className="text-sm text-ds-textMuted mt-0.5">
              {total} submitted attempt{total !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg px-4 py-4 flex items-center gap-3">
              <Sk className="w-9 h-9 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-3.5 w-48" />
                <Sk className="h-3 w-64" />
              </div>
              <Sk className="h-7 w-16 rounded" />
              <Sk className="h-7 w-20 rounded-btn" />
            </div>
          ))}
        </div>
      ) : attempts.length === 0 ? (
        <div className="text-center py-20 bg-ds-card border border-dashed border-ds-border rounded-lg">
          <p className="text-ds-textMuted text-sm">No submitted attempts yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {attempts.map(attempt => {
              const scoreDisplay = attempt.score !== null && attempt.score !== undefined
                ? `${attempt.score}/${attempt.max_score}`
                : attempt.max_score ? `—/${attempt.max_score}` : '—';
              const pct = attempt.score !== null && attempt.max_score
                ? Math.round((attempt.score / attempt.max_score) * 100)
                : null;
              const needsGrading = attempt.score === null;

              return (
                <div key={attempt.id}
                  className="bg-ds-card border border-ds-border rounded-lg px-4 py-3.5 hover:border-ds-borderStrong transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-ds-bg border border-ds-border flex items-center justify-center text-xs font-semibold text-ds-textMuted flex-shrink-0">
                      {(attempt.link?.recipient_name || attempt.link?.recipient_email || '?')[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-ds-text">
                          {attempt.link?.recipient_name || attempt.link?.recipient_email}
                        </span>
                        {attempt.link?.recipient_name && (
                          <span className="text-xs text-ds-textMuted">{attempt.link.recipient_email}</span>
                        )}
                        {attempt.auto_submitted && (
                          <span className="text-xs text-ds-warning bg-ds-warningLight border border-ds-warning/30 px-1.5 py-0.5 rounded">Auto-submitted</span>
                        )}
                        {needsGrading && (
                          <span className="text-xs text-primary bg-primary/10 border border-primary/30 px-1.5 py-0.5 rounded font-medium">Needs grading</span>
                        )}
                        {attempt.graded_at && (
                          <span className="text-xs text-ds-success bg-ds-successLight border border-ds-success/30 px-1.5 py-0.5 rounded">Graded</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <IntegrityBadges summary={attempt.integrity_summary || {}} />
                        <span className="text-xs text-ds-textMuted font-mono">
                          {new Date(attempt.submitted_at).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-ds-text font-mono">{scoreDisplay}</p>
                        {pct !== null && (
                          <p className="text-xs text-ds-textMuted">{pct}%</p>
                        )}
                      </div>
                      <Link href={`/admin/tests/${id}/results/${attempt.id}`}
                        className="text-sm bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors">
                        {needsGrading ? 'Grade' : 'Review'}
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-ds-textMuted">{total} attempt{total !== 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
                  ← Prev
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

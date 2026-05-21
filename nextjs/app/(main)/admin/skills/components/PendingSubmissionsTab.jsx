'use client';
import { useState, useEffect } from 'react';

// ── Date formatter ─────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ── SubmissionRow ──────────────────────────────────────────────────────────────

function SubmissionRow({ submission, onRemove }) {
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState('');
  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeNote, setMergeNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const patch = async (body) => {
    setLoading(true);
    setError('');
    try {
      const r = await fetch('/api/v1/admin/skills/submissions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Action failed.');
      onRemove(submission.id);
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleApprove = () => patch({ id: submission.id, status: 'approved' });

  const handleReject = () => {
    if (!rejectOpen) { setRejectOpen(true); setMergeOpen(false); return; }
    patch({ id: submission.id, status: 'rejected', admin_note: rejectNote.trim() || null });
  };

  const handleMerge = () => {
    if (!mergeOpen) { setMergeOpen(true); setRejectOpen(false); return; }
    if (!mergeNote.trim()) { setError('Enter the skill name to merge into.'); return; }
    patch({ id: submission.id, status: 'merged', admin_note: mergeNote.trim() });
  };

  return (
    <div className="card p-4 space-y-3">
      {/* Skill info */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-[var(--c-text)]">{submission.skill_name || submission.name || '—'}</p>
          <p className="text-xs text-[var(--c-text-muted)] mt-0.5">
            {submission.submitted_by_email
              ? `Submitted by ${submission.submitted_by_email}`
              : 'Submitted by unknown'}
            {submission.created_at && (
              <span className="ml-2">{fmtDate(submission.created_at)}</span>
            )}
          </p>
          {submission.description && (
            <p className="text-sm text-[var(--c-text-muted)] mt-1 line-clamp-2">{submission.description}</p>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded px-3 py-2">
          {error}
        </div>
      )}

      {/* Reject inline form */}
      {rejectOpen && (
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-medium text-[var(--c-text-muted)]">
            Rejection note (optional)
          </label>
          <textarea
            rows={2}
            value={rejectNote}
            onChange={e => setRejectNote(e.target.value)}
            placeholder="Optional note for the submitter…"
            className="w-full px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] placeholder:text-[var(--c-text-muted)] resize-none"
          />
        </div>
      )}

      {/* Merge inline form */}
      {mergeOpen && (
        <div className="space-y-2 pt-1">
          <label className="block text-xs font-medium text-[var(--c-text-muted)]">
            Merge into existing skill
          </label>
          <input
            type="text"
            value={mergeNote}
            onChange={e => setMergeNote(e.target.value)}
            placeholder="Existing skill name…"
            className="w-full px-3 py-2 text-sm border border-[var(--c-border)] rounded-lg bg-white text-[var(--c-text)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)] placeholder:text-[var(--c-text-muted)]"
          />
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Approve */}
        <button
          onClick={handleApprove}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-green-50 border border-green-200 text-green-700 font-medium hover:bg-green-100 transition-colors disabled:opacity-50"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Approve
        </button>

        {/* Reject */}
        <button
          onClick={handleReject}
          disabled={loading}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
            rejectOpen
              ? 'bg-red-600 border-red-600 text-white hover:bg-red-700'
              : 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          {rejectOpen ? 'Confirm Reject' : 'Reject'}
        </button>

        {/* Merge */}
        <button
          onClick={handleMerge}
          disabled={loading}
          className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border font-medium transition-colors disabled:opacity-50 ${
            mergeOpen
              ? 'bg-[var(--c-primary)] border-[var(--c-primary)] text-white hover:opacity-90'
              : 'bg-white border-[var(--c-border)] text-[var(--c-text-muted)] hover:text-[var(--c-text)] hover:border-[var(--c-text-muted)]'
          }`}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/>
          </svg>
          {mergeOpen ? 'Confirm Merge' : 'Merge'}
        </button>

        {/* Cancel expanded forms */}
        {(rejectOpen || mergeOpen) && (
          <button
            type="button"
            onClick={() => { setRejectOpen(false); setMergeOpen(false); setError(''); }}
            className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors"
          >
            Cancel
          </button>
        )}

        {loading && (
          <span className="text-xs text-[var(--c-text-muted)]">Saving…</span>
        )}
      </div>
    </div>
  );
}

// ── PendingSubmissionsTab ─────────────────────────────────────────────────────

export default function PendingSubmissionsTab({ onCountChange }) {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetch('/api/v1/admin/skills/submissions?status=pending')
      .then(r => r.json())
      .then(d => {
        if (cancelled) return;
        setSubmissions(d.submissions || []);
      })
      .catch(() => {
        if (!cancelled) setError('Failed to load pending submissions. Please try again.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  // Notify parent whenever submissions list changes
  useEffect(() => {
    onCountChange?.(submissions.length);
  }, [submissions, onCountChange]);

  const handleRemove = (id) => {
    setSubmissions(prev => prev.filter(s => s.id !== id));
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="card p-4 space-y-3">
            <div className="ds-skel h-4 w-48 rounded" />
            <div className="ds-skel h-3 w-64 rounded" />
            <div className="flex gap-2">
              <div className="ds-skel h-7 w-20 rounded-lg" />
              <div className="ds-skel h-7 w-16 rounded-lg" />
              <div className="ds-skel h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────

  if (error) {
    return (
      <div className="card p-6 text-center space-y-3">
        <p className="text-sm text-red-600">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-sm text-[var(--c-primary)] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Empty state ───────────────────────────────────────────────────────────

  if (submissions.length === 0) {
    return (
      <div className="card py-16 text-center">
        <div className="mx-auto mb-3 w-10 h-10 rounded-full bg-green-50 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-500">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <p className="text-sm font-medium text-[var(--c-text)]">All caught up!</p>
        <p className="text-xs text-[var(--c-text-muted)] mt-1">No pending skill submissions at this time.</p>
      </div>
    );
  }

  // ── List ──────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-3">
      <p className="text-sm text-[var(--c-text-muted)]">
        {submissions.length} submission{submissions.length !== 1 ? 's' : ''} awaiting review
      </p>
      {submissions.map(sub => (
        <SubmissionRow
          key={sub.id}
          submission={sub}
          onRemove={handleRemove}
        />
      ))}
    </div>
  );
}

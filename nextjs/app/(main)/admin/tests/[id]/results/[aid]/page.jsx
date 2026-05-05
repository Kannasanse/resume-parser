'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

const EVENT_COLORS = {
  tab_switch:       { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     icon: '⚠' },
  copy_attempt:     { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  icon: '⎘' },
  paste_attempt:    { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200',  icon: '⎘' },
  right_click:      { bg: 'bg-yellow-50',  text: 'text-yellow-700',  border: 'border-yellow-200',  icon: '🖱' },
  focus_lost:       { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200',    icon: '◌' },
  focus_regained:   { bg: 'bg-green-50',   text: 'text-green-700',   border: 'border-green-200',   icon: '◉' },
  visibility_change:{ bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',     icon: '⚠' },
};

const EVENT_LABELS = {
  tab_switch: 'Tab Switch', copy_attempt: 'Copy Attempt', paste_attempt: 'Paste Attempt',
  right_click: 'Right-click', focus_lost: 'Focus Lost', focus_regained: 'Focus Regained',
  visibility_change: 'Visibility Change',
};

// ─── Score bar ────────────────────────────────────────────────────────────────
function ScoreBar({ score, max }) {
  if (!max) return null;
  const pct = Math.min(100, Math.round((score / max) * 100));
  const color = pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500';
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-ds-border rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-sm font-mono font-semibold text-ds-text w-16 text-right">
        {score ?? '—'}/{max} ({pct}%)
      </span>
    </div>
  );
}

// ─── Points editor ────────────────────────────────────────────────────────────
function PointsEditor({ value, max, onChange }) {
  const [editing, setEditing] = useState(false);
  const [local, setLocal] = useState(String(value ?? 0));

  const commit = () => {
    const n = Math.max(0, Math.min(max, parseFloat(local) || 0));
    onChange(n);
    setLocal(String(n));
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          type="number" min="0" max={max} step="0.5"
          value={local}
          onChange={e => setLocal(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') { setLocal(String(value ?? 0)); setEditing(false); } }}
          autoFocus
          className="w-16 px-2 py-1 text-xs border border-primary rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <span className="text-xs text-ds-textMuted">/{max}</span>
      </div>
    );
  }
  return (
    <button onClick={() => setEditing(true)}
      className="text-xs font-mono font-semibold text-ds-text hover:text-primary transition-colors group flex items-center gap-1">
      {value ?? 0}/{max}
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
        className="opacity-0 group-hover:opacity-100 transition-opacity">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>
      </svg>
    </button>
  );
}

// ─── Single response card ─────────────────────────────────────────────────────
function ResponseCard({ resp, index, onGradeChange }) {
  const q = resp.test_questions;
  if (!q) return null;

  const correctOpt = q.test_options?.find(o => o.is_correct);
  const selectedOpt = q.test_options?.find(o => o.id === resp.selected_option_id);
  const isAutoGraded = q.type !== 'short_answer';

  const handleCorrectToggle = (isCorrect) => {
    const pts = isCorrect ? q.points : 0;
    onGradeChange(resp.id, isCorrect, pts);
  };

  return (
    <div className={`bg-ds-card border rounded-lg p-4 space-y-3 ${
      resp.is_correct === true  ? 'border-ds-success/40' :
      resp.is_correct === false ? 'border-ds-danger/30' :
      'border-ds-border'
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Q{index + 1}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded border ${
              q.type === 'mcq' ? 'bg-primary/10 text-primary border-primary/30' :
              q.type === 'true_false' ? 'bg-ds-successLight text-ds-success border-ds-success/30' :
              'bg-ds-bg text-ds-textMuted border-ds-border'
            }`}>
              {q.type === 'mcq' ? 'MCQ' : q.type === 'true_false' ? 'True/False' : 'Short Answer'}
            </span>
            {isAutoGraded && (
              <span className="text-xs text-ds-textMuted bg-ds-bg border border-ds-border px-1.5 py-0.5 rounded">Auto-graded</span>
            )}
          </div>
          <p className="text-sm font-medium text-ds-text leading-snug">{q.question_text}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <PointsEditor
            value={resp.points_awarded}
            max={q.points}
            onChange={(pts) => onGradeChange(resp.id, pts === q.points ? true : pts > 0 ? null : false, pts)}
          />
          <p className="text-xs text-ds-textMuted mt-0.5">points</p>
        </div>
      </div>

      {/* MCQ / T-F answer */}
      {(q.type === 'mcq' || q.type === 'true_false') && (
        <div className="space-y-1.5 pl-1">
          {(q.test_options || []).sort((a, b) => a.position - b.position).map(opt => {
            const wasSelected = opt.id === resp.selected_option_id;
            const isCorrectOpt = opt.is_correct;
            return (
              <div key={opt.id} className={`flex items-center gap-2 px-3 py-2 rounded text-sm ${
                wasSelected && isCorrectOpt ? 'bg-ds-successLight text-ds-success' :
                wasSelected && !isCorrectOpt ? 'bg-ds-dangerLight text-ds-danger' :
                isCorrectOpt ? 'bg-ds-successLight/50 text-ds-success' :
                'bg-ds-bg text-ds-textSecondary'
              }`}>
                <span className="flex-shrink-0 text-xs">
                  {wasSelected ? '●' : '○'}
                </span>
                <span className="flex-1">{opt.option_text}</span>
                {isCorrectOpt && <span className="text-xs font-medium">✓ Correct</span>}
                {wasSelected && !isCorrectOpt && <span className="text-xs font-medium">✗ Selected</span>}
              </div>
            );
          })}
        </div>
      )}

      {/* Short answer */}
      {q.type === 'short_answer' && (
        <div className="pl-1">
          <p className="text-xs text-ds-textMuted mb-1.5">Candidate response</p>
          <div className="bg-ds-bg border border-ds-border rounded px-3 py-2.5 text-sm text-ds-text min-h-[60px] whitespace-pre-wrap">
            {resp.text_response || <span className="italic text-ds-textMuted">No response</span>}
          </div>
        </div>
      )}

      {/* Grade override buttons */}
      <div className="flex items-center gap-2 pt-1 border-t border-ds-border">
        <span className="text-xs text-ds-textMuted">Grade override:</span>
        <button
          onClick={() => handleCorrectToggle(true)}
          className={`text-xs px-3 py-1 rounded border transition-colors font-medium ${
            resp.is_correct === true
              ? 'bg-ds-success text-white border-ds-success'
              : 'border-ds-border text-ds-textMuted hover:bg-ds-successLight hover:text-ds-success hover:border-ds-success/40'
          }`}>
          ✓ Correct ({q.points}pt)
        </button>
        <button
          onClick={() => handleCorrectToggle(false)}
          className={`text-xs px-3 py-1 rounded border transition-colors font-medium ${
            resp.is_correct === false
              ? 'bg-ds-danger text-white border-ds-danger'
              : 'border-ds-border text-ds-textMuted hover:bg-ds-dangerLight hover:text-ds-danger hover:border-ds-danger/40'
          }`}>
          ✗ Incorrect (0pt)
        </button>
        {resp.is_correct !== null && (
          <button
            onClick={() => onGradeChange(resp.id, null, resp.points_awarded)}
            className="text-xs px-2 py-1 rounded border border-ds-border text-ds-textMuted hover:bg-ds-bg transition-colors">
            Clear
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main grading page ────────────────────────────────────────────────────────
export default function GradeAttempt() {
  const { id, aid } = useParams();
  const [data, setData]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [grades, setGrades] = useState({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);
  const [showEvents, setShowEvents] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(`/api/v1/admin/tests/${id}/attempts/${aid}`);
      const d = await r.json();
      setData(d.attempt);
      // Seed grades from current values
      const initial = {};
      for (const resp of d.attempt?.responses || []) {
        initial[resp.id] = {
          response_id: resp.id,
          is_correct: resp.is_correct,
          points_awarded: resp.points_awarded ?? 0,
        };
      }
      setGrades(initial);
    } finally {
      setLoading(false);
    }
  }, [id, aid]);

  useEffect(() => { load(); }, [load]);

  const handleGradeChange = (responseId, isCorrect, pointsAwarded) => {
    setGrades(prev => ({
      ...prev,
      [responseId]: { response_id: responseId, is_correct: isCorrect, points_awarded: pointsAwarded },
    }));
    setSaved(false);
  };

  const saveGrades = async () => {
    setSaving(true);
    try {
      const r = await fetch(`/api/v1/admin/tests/${id}/attempts/${aid}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: Object.values(grades) }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      // Update local score
      setData(prev => ({ ...prev, score: d.score, graded_at: new Date().toISOString() }));
      setSaved(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const currentScore = Object.values(grades).reduce((s, g) => s + (parseFloat(g.points_awarded) || 0), 0);

  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-7 bg-ds-border/60 rounded w-64" />
        <div className="h-4 bg-ds-border/40 rounded w-48" />
        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="col-span-2 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 bg-ds-border/30 rounded-lg" />)}
          </div>
          <div className="h-64 bg-ds-border/20 rounded-lg" />
        </div>
      </div>
    );
  }

  if (!data) return <p className="text-ds-textMuted">Attempt not found.</p>;

  const link = data.test_links;
  const responses = data.responses || [];
  const events = data.integrity_events || [];
  const summary = data.integrity_summary || {};
  const totalFlags = Object.values(summary).reduce((s, n) => s + n, 0);
  const highRiskKeys = ['tab_switch', 'copy_attempt', 'paste_attempt'];
  const highRiskCount = highRiskKeys.reduce((s, k) => s + (summary[k] || 0), 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link href={`/admin/tests/${id}/results`} className="text-ds-textMuted hover:text-ds-text transition-colors mt-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ds-text font-heading">
              {link?.recipient_name || link?.recipient_email}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-ds-textMuted">
              {link?.recipient_name && <span>{link.recipient_email}</span>}
              <span className="font-mono">Submitted {new Date(data.submitted_at).toLocaleString()}</span>
              {data.auto_submitted && (
                <span className="text-ds-warning bg-ds-warningLight border border-ds-warning/30 px-1.5 py-0.5 rounded font-medium">Auto-submitted</span>
              )}
              {data.graded_at && (
                <span className="text-ds-success bg-ds-successLight border border-ds-success/30 px-1.5 py-0.5 rounded font-medium">
                  Graded {new Date(data.graded_at).toLocaleString()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={() => setShowEvents(v => !v)}
            className={`text-sm px-3 py-1.5 rounded-btn border transition-colors flex items-center gap-1.5 ${
              highRiskCount > 0
                ? 'border-red-200 text-red-600 bg-red-50 hover:bg-red-100'
                : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'
            }`}>
            {highRiskCount > 0
              ? <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            }
            Violations ({totalFlags})
          </button>
          <button onClick={saveGrades} disabled={saving}
            className="bg-primary text-white px-4 py-1.5 rounded-btn text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center gap-1.5">
            {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Grades'}
          </button>
        </div>
      </div>

      {/* Score summary */}
      <div className="bg-ds-card border border-ds-border rounded-lg px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-ds-text">Score</span>
          <span className="text-xs text-ds-textMuted">
            {saved ? 'Saved' : 'Unsaved changes — click Save Grades'}
          </span>
        </div>
        <ScoreBar score={currentScore} max={data.max_score} />
      </div>

      {/* Two-column layout: responses + violations sidebar */}
      <div className={`grid gap-5 ${showEvents ? 'grid-cols-1 lg:grid-cols-3' : 'grid-cols-1'}`}>
        {/* Questions / responses */}
        <div className={`space-y-3 ${showEvents ? 'lg:col-span-2' : ''}`}>
          <h2 className="text-xs font-semibold text-ds-textMuted uppercase tracking-wide">
            Responses ({responses.length})
          </h2>
          {responses.length === 0 ? (
            <p className="text-sm text-ds-textMuted">No responses recorded.</p>
          ) : (
            responses.map((resp, idx) => (
              <ResponseCard
                key={resp.id}
                resp={{ ...resp, ...( grades[resp.id] ? { is_correct: grades[resp.id].is_correct, points_awarded: grades[resp.id].points_awarded } : {} ) }}
                index={idx}
                onGradeChange={handleGradeChange}
              />
            ))
          )}
        </div>

        {/* Violations sidebar */}
        {showEvents && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold text-ds-textMuted uppercase tracking-wide">
                Violation Events ({totalFlags})
              </h2>
              <button onClick={() => setShowEvents(false)} className="text-ds-textMuted hover:text-ds-text text-lg leading-none">×</button>
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(summary).map(([type, count]) => {
                if (!count || !EVENT_LABELS[type]) return null;
                const c = EVENT_COLORS[type] || EVENT_COLORS.focus_lost;
                return (
                  <span key={type} className={`text-xs px-2 py-0.5 rounded border font-medium ${c.bg} ${c.text} ${c.border}`}>
                    {count}× {EVENT_LABELS[type]}
                  </span>
                );
              })}
              {totalFlags === 0 && <span className="text-xs text-ds-success">No violations recorded</span>}
            </div>

            {/* Timeline */}
            {events.length > 0 && (
              <div className="border border-ds-border rounded-lg overflow-hidden">
                <div className="max-h-[600px] overflow-y-auto">
                  {events.map((ev, i) => {
                    const c = EVENT_COLORS[ev.event_type] || EVENT_COLORS.focus_lost;
                    const elapsed = data.started_at
                      ? Math.floor((new Date(ev.occurred_at) - new Date(data.started_at)) / 1000)
                      : null;
                    const elapsedStr = elapsed !== null
                      ? `+${Math.floor(elapsed / 60)}:${String(elapsed % 60).padStart(2, '0')}`
                      : '';
                    return (
                      <div key={ev.id}
                        className={`flex items-start gap-2.5 px-3 py-2.5 text-xs border-b border-ds-border last:border-0 ${c.bg}`}>
                        <span className={`font-bold flex-shrink-0 mt-0.5 ${c.text}`}>{c.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${c.text}`}>{EVENT_LABELS[ev.event_type] || ev.event_type}</p>
                          <p className="text-gray-400 font-mono mt-0.5">
                            {new Date(ev.occurred_at).toLocaleTimeString()}
                            {elapsedStr && ` · ${elapsedStr} in`}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom save */}
      <div className="flex justify-end pt-2 border-t border-ds-border">
        <button onClick={saveGrades} disabled={saving}
          className="bg-primary text-white px-6 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : saved ? '✓ Grades Saved' : 'Save Grades'}
        </button>
      </div>
    </div>
  );
}

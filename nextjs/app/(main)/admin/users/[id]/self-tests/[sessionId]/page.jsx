'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';

const MODE_LABELS = {
  skills:  'Assess by Skill',
  content: 'Assess by Content',
  jd:      'Assess by JD',
};
const DIFF_COLORS = {
  easy:   'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard:   'bg-red-50 text-red-700 border-red-200',
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function readiness(pct) {
  if (pct === null || pct === undefined) return null;
  if (pct >= 80) return { label: 'Strong Match',     cls: 'bg-ds-successLight text-ds-success border-ds-success/30' };
  if (pct >= 50) return { label: 'Partial Match',    cls: 'bg-amber-50 text-amber-700 border-amber-200' };
  return           { label: 'Needs Improvement', cls: 'bg-ds-dangerLight text-ds-danger border-ds-danger/30' };
}

function SkillRow({ skill, sortCol, sortDir }) {
  const r = readiness(skill.pct);
  const weak = skill.pct < 60;
  return (
    <tr className={weak ? 'bg-amber-50/40 dark:bg-amber-900/10' : ''}>
      <td className="px-3 py-2.5 font-medium text-ds-text">{skill.name}</td>
      <td className="px-3 py-2.5 text-ds-textMuted text-sm">{skill.type}</td>
      <td className="px-3 py-2.5 text-center">{skill.total}</td>
      <td className="px-3 py-2.5 text-center">{skill.correct}</td>
      <td className="px-3 py-2.5 text-right font-mono">
        <span className={weak ? 'text-amber-700 font-semibold' : ''}>{skill.pct}%</span>
        {weak && <span className="ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">Needs Improvement</span>}
      </td>
    </tr>
  );
}

export default function AdminSelfTestDetailPage() {
  const { id: userId, sessionId } = useParams();
  const [state, setState]   = useState('loading');
  const [data, setData]     = useState(null);
  const [error, setError]   = useState('');
  const [retryCount, setRetryCount] = useState(0);

  // JD text expansion
  const [jdExpanded, setJdExpanded] = useState(false);
  // Skill sort
  const [skillSort, setSkillSort]   = useState('pct');
  const [skillDir, setSkillDir]     = useState('desc');

  // Back URL from query param
  const [backUrl, setBackUrl] = useState(`/admin/users/${userId}?tab=self-tests`);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const back = new URLSearchParams(window.location.search).get('back');
      if (back) setBackUrl(decodeURIComponent(back));
    }
  }, []);

  useEffect(() => {
    setState('loading');
    fetch(`/api/v1/admin/users/${userId}/self-tests/${sessionId}`)
      .then(async r => {
        const body = await r.json();
        if (!r.ok) { setError(body.error || 'Failed to load.'); setState('error'); return; }
        setData(body);
        setState('ready');
      })
      .catch(() => { setError('Network error. Please try again.'); setState('error'); });
  }, [userId, sessionId, retryCount]);

  if (state === 'loading') {
    return (
      <div className="max-w-3xl space-y-6 animate-pulse">
        <Sk className="h-5 w-64" />
        <Sk className="h-36 w-full rounded-lg" />
        <Sk className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="max-w-3xl">
        <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger rounded-lg p-5 space-y-3">
          <p className="text-sm font-medium">{error || "We couldn't load this test's details. Please try again."}</p>
          <div className="flex gap-3">
            <button onClick={() => setRetryCount(c => c + 1)} className="text-sm font-semibold underline">Retry</button>
            <Link href={backUrl} className="text-sm text-ds-textMuted hover:text-ds-text">← Back</Link>
          </div>
        </div>
      </div>
    );
  }

  const { session, attempt, per_skill } = data;
  const r = session.input_type === 'jd' ? readiness(attempt?.pct) : null;

  // Sort per_skill table
  const sortedSkills = per_skill ? [...per_skill].sort((a, b) => {
    const av = skillSort === 'name' ? a.name : a.pct;
    const bv = skillSort === 'name' ? b.name : b.pct;
    if (av < bv) return skillDir === 'asc' ? -1 : 1;
    if (av > bv) return skillDir === 'asc' ?  1 : -1;
    return 0;
  }) : null;

  const handleSkillSort = (col) => {
    if (skillSort === col) setSkillDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSkillSort(col); setSkillDir(col === 'name' ? 'asc' : 'desc'); }
  };

  const shortId = sessionId.slice(0, 8).toUpperCase();

  return (
    <div className="max-w-3xl space-y-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-xs text-ds-textMuted flex-wrap">
        <Link href="/admin/users" className="hover:text-ds-text">User Management</Link>
        <span>/</span>
        <Link href={`/admin/users/${userId}`} className="hover:text-ds-text">Profile</Link>
        <span>/</span>
        <Link href={backUrl} className="hover:text-ds-text">Interview Prep</Link>
        <span>/</span>
        <span className="text-ds-text font-medium">Test #{shortId}</span>
      </nav>

      {/* Summary card */}
      <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="space-y-1">
            <p className="text-xs text-ds-textMuted uppercase tracking-wide font-medium">Interview Prep</p>
            <h1 className="text-lg font-bold text-ds-text font-heading">{MODE_LABELS[session.input_type] || session.input_type}</h1>
            <p className="text-xs text-ds-textMuted">Test ID: {sessionId}</p>
          </div>
          <div className="text-right space-y-1">
            {attempt ? (
              <>
                <p className="text-3xl font-bold text-ds-text font-heading">
                  {attempt.pct}<span className="text-lg font-normal text-ds-textMuted">%</span>
                </p>
                <p className="text-xs text-ds-textMuted">{attempt.score} / {attempt.max_score} pts</p>
                {r && (
                  <span className={`inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full border ${r.cls}`}>
                    {r.label}
                  </span>
                )}
              </>
            ) : (
              <p className="text-sm text-ds-textMuted italic">No attempt recorded</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-ds-border">
          <div>
            <p className="text-xs text-ds-textMuted">Status</p>
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${session.status === 'completed' ? 'bg-ds-successLight text-ds-success' : 'bg-ds-bg text-ds-textMuted border border-ds-border'}`}>
              {session.status === 'completed' ? 'Completed' : 'Abandoned'}
            </span>
          </div>
          <div>
            <p className="text-xs text-ds-textMuted">Difficulty</p>
            {session.difficulty
              ? <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${DIFF_COLORS[session.difficulty]}`}>{session.difficulty}</span>
              : <span className="text-xs text-ds-textMuted">—</span>
            }
          </div>
          <div>
            <p className="text-xs text-ds-textMuted">Questions</p>
            <p className="text-sm font-semibold text-ds-text">{session.question_count}</p>
          </div>
          <div>
            <p className="text-xs text-ds-textMuted">Timer</p>
            <p className="text-sm font-semibold text-ds-text">{session.timer_minutes} min</p>
          </div>
        </div>

        {attempt && (
          <div className="flex flex-wrap gap-4 text-xs text-ds-textMuted pt-2 border-t border-ds-border">
            <span>Submitted: {fmt(attempt.submitted_at)}</span>
            {attempt.auto_submitted && <span className="text-amber-600 font-medium">Auto-submitted (timer expired)</span>}
          </div>
        )}
      </div>

      {/* Per-skill breakdown (JD mode) */}
      {session.input_type === 'jd' && (
        <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-ds-border">
            <h2 className="text-sm font-semibold text-ds-text">Skill Breakdown</h2>
          </div>
          {!per_skill || per_skill.length === 0 ? (
            <p className="px-5 py-4 text-sm text-ds-textMuted">
              {attempt ? 'Skill-level details could not be loaded.' : 'No results — test was not completed.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ds-bg border-b border-ds-border">
                  <tr>
                    {[['name', 'Skill'], ['type', 'Type'], ['total', 'Questions'], ['correct', 'Correct'], ['pct', 'Score']].map(([col, label]) => (
                      <th key={col}
                        onClick={() => ['name', 'pct'].includes(col) ? handleSkillSort(col) : undefined}
                        className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ds-textMuted whitespace-nowrap ${col === 'pct' ? 'text-right' : 'text-left'} ${['name', 'pct'].includes(col) ? 'cursor-pointer hover:text-ds-text select-none' : ''}`}
                      >
                        {label}
                        {['name', 'pct'].includes(col) && (
                          <span className="ml-1">{skillSort === col ? (skillDir === 'asc' ? '↑' : '↓') : <span className="opacity-30">↕</span>}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ds-border">
                  {sortedSkills.map(s => <SkillRow key={s.name} skill={s} />)}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* JD text (if available) */}
      {session.input_type === 'jd' && (
        <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
          <div className="px-5 py-3 border-b border-ds-border flex items-center justify-between">
            <h2 className="text-sm font-semibold text-ds-text">Job Description</h2>
          </div>
          <div className="p-5">
            {session.jd_text ? (
              <>
                <p className="text-sm text-ds-text whitespace-pre-wrap leading-relaxed">
                  {jdExpanded ? session.jd_text : session.jd_text.slice(0, 500) + (session.jd_text.length > 500 ? '…' : '')}
                </p>
                {session.jd_text.length > 500 && (
                  <button onClick={() => setJdExpanded(e => !e)} className="text-xs text-primary hover:underline mt-2">
                    {jdExpanded ? 'Show less' : 'Show more'}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-ds-textMuted italic">Job description text is no longer available.</p>
            )}
          </div>
        </div>
      )}

      {/* Back */}
      <div className="pb-6">
        <Link href={backUrl} className="inline-flex items-center gap-1.5 text-sm text-ds-textMuted hover:text-ds-text transition-colors">
          ← Back to Interview Prep
        </Link>
      </div>
    </div>
  );
}

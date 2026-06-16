'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

// ─── Icons ─────────────────────────────────────────────────────────────────────
function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  );
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleString();
}

// ─── Score header ───────────────────────────────────────────────────────────────
function ScoreHeader({ attempt, test, link, pendingCount }) {
  const hasScore = attempt.score !== null;
  const pct = hasScore && attempt.max_score > 0
    ? Math.round((attempt.score / attempt.max_score) * 100)
    : null;

  const band =
    pct === null ? null :
    pct >= 80 ? { label: 'Excellent', cls: 'text-ds-success' } :
    pct >= 60 ? { label: 'Good',      cls: 'text-amber-600' } :
                { label: 'Needs work', cls: 'text-ds-danger' };

  return (
    <div className="bg-ds-surface border border-ds-border rounded-lg p-6 space-y-3">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-ds-textMuted uppercase tracking-wide font-medium mb-1">Admin-Assigned Test</p>
          <h1 className="text-xl font-semibold text-ds-text">{test.title}</h1>
          {test.job_profile && (
            <p className="text-sm text-ds-textMuted mt-0.5">{test.job_profile}</p>
          )}
        </div>
        <div className="text-right">
          {hasScore ? (
            <>
              <p className="text-3xl font-bold text-ds-text">
                {attempt.score}<span className="text-lg font-normal text-ds-textMuted">/{attempt.max_score}</span>
              </p>
              {pct !== null && (
                <p className={`text-sm font-medium ${band.cls}`}>{pct}% — {band.label}</p>
              )}
            </>
          ) : (
            <p className="text-sm text-ds-textMuted italic">Score pending</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-ds-textMuted pt-1 border-t border-ds-border">
        <span>Submitted {fmtDateTime(attempt.submitted_at)}</span>
        {attempt.auto_submitted && <span className="text-amber-600 font-medium">Auto-submitted (time expired)</span>}
        {link.recipient_name && <span>Candidate: {link.recipient_name}</span>}
        {pendingCount > 0 && (
          <span className="text-amber-600 font-medium">
            {pendingCount} short-answer question{pendingCount > 1 ? 's' : ''} pending manual review
          </span>
        )}
      </div>
    </div>
  );
}

// ─── MCQ / True‑False question ──────────────────────────────────────────────────
function ChoiceQuestion({ q, index, total }) {
  const answered = q.answered;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ds-text leading-relaxed flex-1">
          <span className="text-ds-textMuted font-normal mr-1.5">Q{index + 1}/{total}.</span>
          {q.question_text}
        </p>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {q.is_correct === true && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border bg-ds-successLight text-ds-success border-ds-success/30">
              <CheckIcon /> Correct
            </span>
          )}
          {q.is_correct === false && (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border bg-ds-dangerLight text-ds-danger border-ds-danger/30">
              <XIcon /> Incorrect
            </span>
          )}
          {q.is_correct === null && answered && (
            <span className="text-xs text-ds-textMuted italic">Not graded</span>
          )}
          <span className="text-xs text-ds-textMuted">{q.points_awarded}/{q.points} pts</span>
        </div>
      </div>

      <div className="space-y-2">
        {q.options.map(opt => {
          let cls = 'border-ds-border text-ds-textMuted bg-transparent';
          if (opt.was_correct && opt.was_selected) cls = 'border-ds-success bg-ds-successLight text-ds-success font-medium';
          else if (opt.was_correct)                cls = 'border-ds-success/50 bg-ds-successLight/50 text-ds-success';
          else if (opt.was_selected)               cls = 'border-ds-danger bg-ds-dangerLight text-ds-danger';

          return (
            <div key={opt.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg border text-sm transition-none ${cls}`}>
              <span className="flex-shrink-0 w-5 h-5 rounded-full border flex items-center justify-center text-xs font-bold border-current">
                {opt.was_correct ? <CheckIcon /> : opt.was_selected ? <XIcon /> : null}
              </span>
              <span className="flex-1">{opt.option_text}</span>
              {opt.was_correct && !opt.was_selected && (
                <span className="text-xs font-medium text-ds-success">Correct answer</span>
              )}
            </div>
          );
        })}
      </div>

      {!answered && (
        <p className="text-xs text-ds-textMuted italic">You did not answer this question.</p>
      )}
    </div>
  );
}

// ─── Short answer question ──────────────────────────────────────────────────────
function ShortAnswerQuestion({ q, index, total }) {
  const pending = q.is_correct === null;

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ds-text leading-relaxed flex-1">
          <span className="text-ds-textMuted font-normal mr-1.5">Q{index + 1}/{total}.</span>
          {q.question_text}
        </p>
        <div className="flex-shrink-0 flex items-center gap-1.5">
          {pending ? (
            <span className="text-xs font-medium px-2 py-0.5 rounded border bg-amber-50 text-amber-600 border-amber-200">
              Pending review
            </span>
          ) : q.is_correct === true ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border bg-ds-successLight text-ds-success border-ds-success/30">
              <CheckIcon /> Graded: {q.points_awarded}/{q.points} pts
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded border bg-ds-dangerLight text-ds-danger border-ds-danger/30">
              <XIcon /> Graded: {q.points_awarded}/{q.points} pts
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <div className="rounded-lg border border-ds-border bg-ds-bg p-3">
          <p className="text-xs font-medium text-ds-textMuted mb-1.5">Your answer</p>
          {q.text_response ? (
            <p className="text-sm text-ds-text whitespace-pre-wrap">{q.text_response}</p>
          ) : (
            <p className="text-xs text-ds-textMuted italic">No answer provided.</p>
          )}
        </div>

        {q.expected_answer && (
          <div className="rounded-lg border border-ds-success/30 bg-ds-successLight/30 p-3">
            <p className="text-xs font-medium text-ds-success mb-1.5">Model answer</p>
            <p className="text-sm text-ds-text whitespace-pre-wrap">{q.expected_answer}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading skeleton ───────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 animate-pulse">
      <div className="h-32 bg-ds-border rounded-lg" />
      <div className="h-48 bg-ds-border rounded-lg" />
      <div className="h-48 bg-ds-border rounded-lg" />
    </div>
  );
}

// ─── Error state ─────────────────────────────────────────────────────────────
function ErrorState({ message, onRetry, router }) {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
      <p className="text-ds-danger font-medium">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="text-sm text-ds-accent hover:underline">Try again</button>
      )}
      <div>
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ds-textMuted hover:text-ds-text">
          <ArrowLeftIcon /> Go back
        </button>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ReviewPage() {
  const { id } = useParams();
  const router = useRouter();
  const [state, setState] = useState('loading'); // loading | ready | error
  const [data, setData] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    setState('loading');
    fetch(`/api/v1/review/${id}`)
      .then(async r => {
        const body = await r.json();
        if (!r.ok) {
          setErrorMsg(body.error || 'Failed to load review.');
          setState('error');
          return;
        }
        setData(body);
        setState('ready');
      })
      .catch(() => {
        setErrorMsg('Network error. Please try again.');
        setState('error');
      });
  }, [id, retryCount]);

  if (state === 'loading') return <Skeleton />;

  if (state === 'error') {
    return (
      <ErrorState
        message={errorMsg}
        onRetry={['Review is not available for this test.', 'Forbidden'].includes(errorMsg) ? null : () => setRetryCount(c => c + 1)}
        router={router}
      />
    );
  }

  const { attempt, test, link, questions, pending_short_answer_count } = data;
  const total = questions.length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      {/* Back */}
      <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ds-textMuted hover:text-ds-text transition-colors">
        <ArrowLeftIcon /> Back
      </button>

      {/* Score header */}
      <ScoreHeader attempt={attempt} test={test} link={link} pendingCount={pending_short_answer_count} />

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-ds-textMuted">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-ds-successLight border border-ds-success/50 inline-block" /> Correct answer</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-ds-dangerLight border border-ds-danger/50 inline-block" /> Your wrong selection</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm border border-ds-border inline-block" /> Not selected</span>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        {questions.map((q, i) => (
          <div key={q.id} className="bg-ds-surface border border-ds-border rounded-lg p-5">
            {(q.type === 'mcq' || q.type === 'true_false') ? (
              <ChoiceQuestion q={q} index={i} total={total} />
            ) : (
              <ShortAnswerQuestion q={q} index={i} total={total} />
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="text-center pt-4 pb-8">
        <button onClick={() => router.back()} className="inline-flex items-center gap-1.5 text-sm text-ds-textMuted hover:text-ds-text transition-colors">
          <ArrowLeftIcon /> Exit review
        </button>
      </div>
    </div>
  );
}

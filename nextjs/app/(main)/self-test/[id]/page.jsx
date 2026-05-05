'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const DIFF_COLORS = {
  easy:   'bg-green-50  text-green-700  border-green-200',
  medium: 'bg-amber-50  text-amber-700  border-amber-200',
  hard:   'bg-red-50    text-red-700    border-red-200',
};

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function FlagIcon({ filled }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}

// ─── Question display ─────────────────────────────────────────────────────────
function QuestionView({ question, index, total, answer, onAnswer, flagged, onFlag, isResults, result }) {
  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ds-text leading-relaxed flex-1">
          <span className="text-ds-textMuted font-normal mr-1.5">Q{index + 1}.</span>
          {question.question_text}
        </p>
        {!isResults && (
          <button onClick={onFlag} title={flagged ? 'Remove flag' : 'Flag for review'}
            className={`flex-shrink-0 mt-0.5 p-1.5 rounded transition-colors ${flagged ? 'text-amber-600 bg-amber-50 border border-amber-200' : 'text-ds-textMuted hover:text-amber-600 hover:bg-amber-50'}`}>
            <FlagIcon filled={flagged} />
          </button>
        )}
        {isResults && result && (
          <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded border ${result.correct ? 'bg-ds-successLight text-ds-success border-ds-success/30' : 'bg-ds-dangerLight text-ds-danger border-ds-danger/30'}`}>
            {result.correct ? '✓ Correct' : '✗ Wrong'}
          </span>
        )}
      </div>

      {question.type === 'mcq' && (
        <div className="space-y-2">
          {(question.options || []).map((opt, i) => {
            const isSelected = answer === String(i);
            const isCorrect  = isResults && result?.correct_index === i;
            const isWrong    = isResults && isSelected && !result?.correct;

            let cls = 'border-ds-border bg-ds-bg text-ds-textMuted';
            if (isCorrect)       cls = 'border-ds-success/60 bg-ds-successLight text-ds-success';
            else if (isWrong)    cls = 'border-ds-danger/60 bg-ds-dangerLight text-ds-danger';
            else if (isSelected) cls = 'border-primary bg-primary/10 text-primary';

            return (
              <button
                key={i}
                disabled={isResults}
                onClick={() => !isResults && onAnswer(String(i))}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${cls} ${!isResults ? 'hover:border-primary hover:bg-primary/5' : ''}`}
              >
                <span className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-xs font-semibold ${
                  isSelected && !isResults ? 'border-primary bg-primary text-white'
                  : isCorrect ? 'border-ds-success bg-ds-success text-white'
                  : isWrong   ? 'border-ds-danger bg-ds-danger text-white'
                  : 'border-ds-border'
                }`}>
                  {isCorrect ? '✓' : isWrong ? '✗' : String.fromCharCode(65 + i)}
                </span>
                {opt.option_text}
              </button>
            );
          })}
        </div>
      )}

      {question.type === 'true_false' && (
        <div className="grid grid-cols-2 gap-3">
          {['true', 'false'].map(v => {
            const isSelected = answer === v;
            const isCorrect  = isResults && result?.correct_answer === v;
            const isWrong    = isResults && isSelected && !result?.correct;

            let cls = 'border-ds-border bg-ds-bg text-ds-textMuted';
            if (isCorrect)       cls = 'border-ds-success/60 bg-ds-successLight text-ds-success';
            else if (isWrong)    cls = 'border-ds-danger/60 bg-ds-dangerLight text-ds-danger';
            else if (isSelected) cls = 'border-primary bg-primary/10 text-primary';

            return (
              <button
                key={v}
                disabled={isResults}
                onClick={() => !isResults && onAnswer(v)}
                className={`py-3 rounded-lg border text-sm font-semibold transition-colors capitalize ${cls} ${!isResults ? 'hover:border-primary hover:bg-primary/5' : ''}`}
              >
                {v}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Main test page ───────────────────────────────────────────────────────────
export default function SelfTestPage() {
  const { id } = useParams();
  const router = useRouter();
  const LS_KEY = `self_test_${id}`;

  const [state, setState]       = useState('loading'); // loading | taking | submitting | results | error
  const [session, setSession]   = useState(null);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers]   = useState({});
  const [flagged, setFlagged]   = useState(new Set());
  const [current, setCurrent]   = useState(0);
  const [timeLeft, setTimeLeft] = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [results, setResults]   = useState(null);  // { score, max_score, results, questions }
  const [connBanner, setConnBanner] = useState(false);

  const timerRef     = useRef(null);
  const submitRef    = useRef(null);

  // Load session on mount
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/v1/self-test/${id}`);
        const d = await r.json();
        if (!r.ok) { setState('error'); return; }

        setSession(d.session);
        setQuestions(d.questions || []);

        if (d.attempt?.submitted_at) {
          // Already completed — show results
          setResults({
            score:      d.attempt.score,
            max_score:  d.attempt.max_score,
            results:    d.attempt.results,
            questions:  d.questions,
            answers:    d.attempt.answers,
            auto_submitted: d.attempt.auto_submitted,
          });
          setState('results');
          return;
        }

        // Restore in-progress state from localStorage
        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          try {
            const { answers: sa, timeLeft: st, flagged: sf } = JSON.parse(saved);
            if (sa) setAnswers(sa);
            if (st > 0) setTimeLeft(st);
            else setTimeLeft(d.session.timer_minutes * 60);
            if (sf) setFlagged(new Set(sf));
          } catch {
            setTimeLeft(d.session.timer_minutes * 60);
          }
        } else {
          setTimeLeft(d.session.timer_minutes * 60);
        }

        setState('taking');
      } catch {
        setState('error');
      }
    }
    load();
  }, [id]);

  // Persist progress to localStorage
  useEffect(() => {
    if (state === 'taking' && timeLeft !== null) {
      localStorage.setItem(LS_KEY, JSON.stringify({ answers, timeLeft, flagged: [...flagged] }));
    }
  }, [answers, timeLeft, flagged, state]);

  // Submit function (used by button and auto-submit)
  const doSubmit = useCallback(async (auto = false) => {
    clearInterval(timerRef.current);
    setState('submitting');
    setSubmitError('');

    const attempt = async () => {
      const r = await fetch(`/api/v1/self-test/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers, time_remaining_seconds: timeLeft || 0, auto_submitted: auto }),
      });
      return r;
    };

    let r = await attempt();
    if (!r.ok) r = await attempt(); // silent retry

    if (!r.ok) {
      setConnBanner(true);
      setState('taking');
      setSubmitError("We had trouble saving your test. Your answers have been preserved — please try submitting again.");
      return;
    }

    const d = await r.json();
    localStorage.removeItem(LS_KEY);
    setResults({
      score:          d.score,
      max_score:      d.max_score,
      results:        d.results,
      questions:      d.questions,
      answers,
      auto_submitted: auto,
    });
    setState('results');
  }, [answers, timeLeft, id]);

  submitRef.current = doSubmit;

  // Timer countdown
  useEffect(() => {
    if (state !== 'taking' || timeLeft === null) return;
    if (timeLeft <= 0) { submitRef.current?.(true); return; }

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        if (next <= 0) {
          clearInterval(timerRef.current);
          submitRef.current?.(true);
          return 0;
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [state]);

  const setAnswer = (qi, val) => setAnswers(prev => ({ ...prev, [String(qi)]: val }));
  const toggleFlag = (i) => setFlagged(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  const answeredCount  = Object.keys(answers).length;
  const unanswered     = questions.length - answeredCount;
  const isLowTime      = timeLeft !== null && timeLeft <= 120;

  // ── Loading ────────────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ds-textMuted">Loading your test…</p>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="max-w-md mx-auto text-center py-16 space-y-3">
        <p className="text-ds-text font-medium">Test not found or unavailable.</p>
        <Link href="/self-test" className="text-sm text-primary hover:underline">← Create a new test</Link>
      </div>
    );
  }

  // ── Submitting ─────────────────────────────────────────────────────────────
  if (state === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ds-textMuted">Scoring your test…</p>
      </div>
    );
  }

  // ── Results ────────────────────────────────────────────────────────────────
  if (state === 'results' && results) {
    const pct = results.max_score > 0 ? Math.round((results.score / results.max_score) * 100) : 0;
    const band = pct >= 80 ? 'Great work!' : pct >= 60 ? 'Good effort!' : 'Keep practising!';

    return (
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Score card */}
        <div className="bg-ds-card border border-ds-border rounded-lg p-6 text-center space-y-3">
          <p className="text-sm text-ds-textMuted font-medium uppercase tracking-wide">Your Score</p>
          <p className="text-5xl font-bold text-ds-text font-heading">{pct}%</p>
          <p className="text-sm text-ds-textMuted">{results.score} / {results.max_score} points — {band}</p>
          {results.auto_submitted && (
            <span className="inline-block text-xs bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-1 rounded">
              Auto-submitted when timer expired
            </span>
          )}
          {session && (
            <div className="flex items-center justify-center gap-2 pt-1">
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${DIFF_COLORS[session.difficulty]}`}>
                {session.difficulty}
              </span>
              <span className="text-xs text-ds-textMuted">{results.questions.length} questions</span>
            </div>
          )}
        </div>

        {/* Per-question breakdown */}
        <div className="space-y-3">
          {(results.questions || []).map((q, i) => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg p-4">
              <QuestionView
                question={q}
                index={i}
                total={results.questions.length}
                answer={results.answers?.[String(i)]}
                onAnswer={() => {}}
                flagged={false}
                onFlag={() => {}}
                isResults
                result={results.results?.[i]}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pb-6">
          <Link href="/self-test"
            className="flex-1 text-center bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark transition-colors">
            Practice Again
          </Link>
          <Link href="/builder"
            className="flex-1 text-center py-2.5 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
            Back to Builder
          </Link>
        </div>
      </div>
    );
  }

  // ── Taking ─────────────────────────────────────────────────────────────────
  const q = questions[current];

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Connection banner */}
      {connBanner && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
          <span>Connection issue detected. Your progress is being saved locally.</span>
          <button onClick={() => setConnBanner(false)} className="text-amber-600 hover:text-amber-800 ml-3">×</button>
        </div>
      )}

      {/* Timer bar */}
      <div className={`bg-ds-card border rounded-lg px-4 py-3 flex items-center justify-between ${isLowTime ? 'border-ds-danger bg-ds-dangerLight' : 'border-ds-border'}`}>
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={isLowTime ? 'text-ds-danger' : 'text-ds-textMuted'}>
            <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
          </svg>
          <span className={`font-mono font-bold text-lg ${isLowTime ? 'text-ds-danger' : 'text-ds-text'}`}>
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'}
          </span>
          {isLowTime && <span className="text-xs text-ds-danger font-semibold animate-pulse">Low time!</span>}
        </div>
        <div className="flex items-center gap-3 text-xs text-ds-textMuted">
          <span>{answeredCount}/{questions.length} answered</span>
          {session && <span className={`px-1.5 py-0.5 rounded border text-xs font-medium ${DIFF_COLORS[session.difficulty]}`}>{session.difficulty}</span>}
        </div>
      </div>

      {/* Timer progress bar */}
      {session && timeLeft !== null && (
        <div className="h-1 bg-ds-bg rounded-full overflow-hidden -mt-2">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${isLowTime ? 'bg-ds-danger' : 'bg-primary'}`}
            style={{ width: `${(timeLeft / (session.timer_minutes * 60)) * 100}%` }}
          />
        </div>
      )}

      {/* Submit error */}
      {submitError && (
        <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2.5 flex items-center justify-between">
          <span>{submitError}</span>
          <button onClick={() => doSubmit(false)} className="text-xs font-semibold underline ml-3 flex-shrink-0">Try Again</button>
        </div>
      )}

      {/* Question card */}
      <div className="bg-ds-card border border-ds-border rounded-lg p-5">
        {q && (
          <QuestionView
            question={q}
            index={current}
            total={questions.length}
            answer={answers[String(current)]}
            onAnswer={val => setAnswer(current, val)}
            flagged={flagged.has(current)}
            onFlag={() => toggleFlag(current)}
            isResults={false}
          />
        )}
      </div>

      {/* Navigation */}
      <div className="bg-ds-card border border-ds-border rounded-lg px-4 py-3 space-y-3">
        {/* Question number pills */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((_, i) => {
            const isAnswered = answers[String(i)] !== undefined;
            const isFlagged  = flagged.has(i);
            const isCurrent  = i === current;

            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                title={isFlagged ? 'Flagged' : isAnswered ? 'Answered' : 'Unanswered'}
                className={`w-8 h-8 rounded text-xs font-semibold transition-colors relative ${
                  isCurrent   ? 'bg-primary text-white'
                  : isAnswered ? 'bg-ds-successLight text-ds-success border border-ds-success/30'
                  : 'bg-ds-bg text-ds-textMuted border border-ds-border hover:border-primary hover:text-primary'
                }`}
              >
                {i + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-white" />
                )}
              </button>
            );
          })}
        </div>

        {/* Prev / Next / Submit */}
        <div className="flex items-center justify-between">
          <button
            disabled={current === 0}
            onClick={() => setCurrent(c => c - 1)}
            className="text-sm text-ds-textMuted hover:text-ds-text disabled:opacity-40 transition-colors px-2 py-1"
          >
            ← Prev
          </button>

          <button
            onClick={() => setConfirmOpen(true)}
            className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-semibold hover:bg-primary-dark transition-colors"
          >
            Submit Test
          </button>

          <button
            disabled={current === questions.length - 1}
            onClick={() => setCurrent(c => c + 1)}
            className="text-sm text-ds-textMuted hover:text-ds-text disabled:opacity-40 transition-colors px-2 py-1"
          >
            Next →
          </button>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-heading font-bold text-ds-text">Submit Test?</h3>
            {unanswered > 0 ? (
              <p className="text-sm text-ds-text">
                Are you sure you want to submit? You have{' '}
                <span className="font-semibold text-ds-danger">{unanswered} unanswered question{unanswered !== 1 ? 's' : ''}</span>.
              </p>
            ) : (
              <p className="text-sm text-ds-text">All questions answered. Ready to submit?</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmOpen(false); doSubmit(false); }}
                className="flex-1 bg-primary text-white py-2 rounded-btn text-sm font-semibold hover:bg-primary-dark transition-colors"
              >
                Yes, Submit
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors"
              >
                Keep Going
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

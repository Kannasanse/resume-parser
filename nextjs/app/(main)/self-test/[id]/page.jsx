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
function QuestionView({
  question, index, answer, onAnswer, flagged, onFlag,
  isResults, result,
  shortAnswerText, onShortAnswerChange,
  selfGradeLoading, onSelfGrade,
}) {
  const isSA = question.type === 'short_answer';

  return (
    <div className="space-y-4">
      {/* Question header */}
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
        {isResults && result && !isSA && (
          <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${result.correct ? 'chip-success' : 'chip-error'}`}>
            {result.correct ? '✓ Correct' : '✗ Wrong'}
          </span>
        )}
        {isResults && result && isSA && (
          result.pending_grade
            ? <span className="flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">Pending</span>
            : <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${result.correct ? 'chip-success' : 'chip-error'}`}>
                {result.correct ? '✓ Correct' : '✗ Incorrect'}
              </span>
        )}
      </div>

      {/* MCQ options */}
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

      {/* True/False */}
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

      {/* Short Answer — quiz mode */}
      {isSA && !isResults && (
        <div className="space-y-1.5">
          <textarea
            value={shortAnswerText || ''}
            onChange={e => onShortAnswerChange(e.target.value)}
            rows={5}
            placeholder="Write your answer here…"
            className="w-full px-3 py-2.5 text-sm border border-ds-inputBorder rounded-lg bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted resize-none leading-relaxed"
            style={{ minHeight: '120px' }}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-ds-textMuted">Write 2–6 sentences for full marks</p>
            <p className="text-xs text-ds-textMuted">
              {(shortAnswerText || '').trim().split(/\s+/).filter(Boolean).length} words
            </p>
          </div>
        </div>
      )}

      {/* Short Answer — results mode */}
      {isSA && isResults && (
        <div className="space-y-3">
          {/* User's answer */}
          <div className="bg-ds-bg border border-ds-border rounded-lg px-3 py-2.5">
            <p className="text-[10px] font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Your Answer</p>
            {result?.short_answer_text
              ? <p className="text-sm text-ds-text leading-relaxed whitespace-pre-wrap">{result.short_answer_text}</p>
              : <p className="text-sm italic text-ds-textMuted">No answer provided</p>
            }
          </div>

          {/* AI grading pending */}
          {result?.grading_method === 'ai' && result?.pending_grade && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
              <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <p className="text-xs text-blue-700">AI is grading this answer…</p>
            </div>
          )}

          {/* AI feedback */}
          {result?.grading_method === 'ai' && result?.ai_feedback && !result?.pending_grade && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-blue-700">AI Feedback</span>
                {result.ai_score != null && (
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-blue-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.round(result.ai_score * 100)}%` }} />
                    </div>
                    <span className="text-xs text-blue-600 font-medium">{Math.round(result.ai_score * 100)}%</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-blue-800 leading-relaxed">{result.ai_feedback}</p>
            </div>
          )}

          {/* Self-grade buttons (pending) */}
          {result?.grading_method === 'self' && result?.pending_grade && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-3">
              <p className="text-xs font-semibold text-amber-700 mb-2">Did you get this right?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => onSelfGrade(index, true)}
                  disabled={selfGradeLoading}
                  className="flex-1 py-2 text-xs font-semibold rounded border border-green-300 bg-green-50 text-green-700 hover:bg-green-100 disabled:opacity-50 transition-colors"
                >
                  {selfGradeLoading ? '…' : '✓ Yes, I got it'}
                </button>
                <button
                  onClick={() => onSelfGrade(index, false)}
                  disabled={selfGradeLoading}
                  className="flex-1 py-2 text-xs font-semibold rounded border border-red-300 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {selfGradeLoading ? '…' : '✗ No, I missed it'}
                </button>
              </div>
            </div>
          )}

          {/* Self-graded result */}
          {result?.grading_method === 'self' && !result?.pending_grade && (
            <div className={`rounded-lg px-3 py-2 text-xs font-semibold border ${
              result.correct
                ? 'bg-green-50 border-green-200 text-green-700'
                : 'bg-red-50 border-red-200 text-red-700'
            }`}>
              {result.correct ? '✓ You marked this correct' : '✗ You marked this incorrect'}
            </div>
          )}

          {/* Model answer */}
          {question.model_answer && (
            <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-semibold text-green-700 uppercase tracking-wide mb-1.5">Model Answer</p>
              <p className="text-sm text-green-800 leading-relaxed">{question.model_answer}</p>
            </div>
          )}
        </div>
      )}

      {/* Explanation — all questions, results only */}
      {isResults && question.explanation && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm leading-none">💡</span>
            <span className="text-xs font-semibold text-amber-700">Explanation</span>
          </div>
          <p className="text-sm text-amber-800 leading-relaxed">{question.explanation}</p>
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

  const [state, setState]             = useState('loading');
  const [session, setSession]         = useState(null);
  const [questions, setQuestions]     = useState([]);
  const [answers, setAnswers]         = useState({});
  const [shortAnswerTexts, setSATexts] = useState({});
  const [flagged, setFlagged]         = useState(new Set());
  const [current, setCurrent]         = useState(0);
  const [timeLeft, setTimeLeft]       = useState(null);
  const [submitError, setSubmitError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [results, setResults]         = useState(null);
  const [localResults, setLocalResults] = useState([]);
  const [combinedPct, setCombinedPct] = useState(null);
  const [selfGradeLoading, setSGLoading] = useState(new Set());
  const [connBanner, setConnBanner]   = useState(false);

  const timerRef  = useRef(null);
  const submitRef = useRef(null);

  // Load session
  useEffect(() => {
    async function load() {
      try {
        const r = await fetch(`/api/v1/self-test/${id}`);
        const d = await r.json();
        if (!r.ok) { setState('error'); return; }

        setSession(d.session);
        setQuestions(d.questions || []);

        if (d.attempt?.submitted_at) {
          setResults({
            score:      d.attempt.score,
            max_score:  d.attempt.max_score,
            results:    d.attempt.results,
            questions:  d.questions,
            answers:    d.attempt.answers,
            auto_submitted: d.attempt.auto_submitted,
          });
          setLocalResults([...(d.attempt.results || [])]);
          if (d.attempt.combined_pct != null) setCombinedPct(d.attempt.combined_pct);
          setState('results');
          return;
        }

        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          try {
            const { answers: sa, shortAnswerTexts: sat, timeLeft: st, flagged: sf } = JSON.parse(saved);
            if (sa)  setAnswers(sa);
            if (sat) setSATexts(sat);
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

  // Persist progress
  useEffect(() => {
    if (state === 'taking' && timeLeft !== null) {
      localStorage.setItem(LS_KEY, JSON.stringify({ answers, shortAnswerTexts, timeLeft, flagged: [...flagged] }));
    }
  }, [answers, shortAnswerTexts, timeLeft, flagged, state]);

  // Submit
  const doSubmit = useCallback(async (auto = false) => {
    clearInterval(timerRef.current);
    setState('submitting');
    setSubmitError('');

    const shortAnswersList = Object.entries(shortAnswerTexts).map(([qi, text]) => ({
      questionIndex: parseInt(qi),
      answerText:    text || '',
      gradingMethod: 'per_question',
    }));

    const attempt = async () => fetch(`/api/v1/self-test/${id}/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ answers, short_answers: shortAnswersList, time_remaining_seconds: timeLeft || 0, auto_submitted: auto }),
    });

    let r = await attempt();
    if (!r.ok) r = await attempt();

    if (!r.ok) {
      setConnBanner(true);
      setState('taking');
      setSubmitError("We had trouble saving your test. Your answers have been preserved — please try submitting again.");
      return;
    }

    const d = await r.json();
    localStorage.removeItem(LS_KEY);

    const baseResults = {
      score:      d.score,
      max_score:  d.max_score,
      results:    d.results,
      questions:  d.questions,
      answers,
      auto_submitted: auto,
      has_short_answers: d.has_short_answers,
    };
    setResults(baseResults);
    setLocalResults([...(d.results || [])]);
    setState('results');

    // AI-grade short answers if needed
    if (d.has_short_answers) {
      const aiAnswers = (d.questions || []).map((q, i) => {
        if (q.type !== 'short_answer') return null;
        const res = d.results?.[i];
        if (!res || res.grading_method !== 'ai') return null;
        return {
          questionIndex:  i,
          questionText:   q.question_text,
          modelAnswer:    q.model_answer    || '',
          gradingRubric:  q.grading_rubric  || '',
          answerKeywords: q.answer_keywords || [],
          userAnswer:     res.short_answer_text || shortAnswerTexts[String(i)] || '',
        };
      }).filter(Boolean);

      if (aiAnswers.length > 0) {
        try {
          const gr = await fetch(`/api/v1/self-test/${id}/grade-short-answers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: aiAnswers }),
          });
          if (gr.ok) {
            const gd = await gr.json();
            setLocalResults(prev => {
              const updated = [...prev];
              for (const grade of (gd.grades || [])) {
                const { questionIndex: qi, score, feedback } = grade;
                if (updated[qi]) {
                  updated[qi] = {
                    ...updated[qi],
                    ai_score:       score,
                    ai_feedback:    feedback,
                    grading_method: 'ai',
                    correct:        score >= 0.7,
                    pending_grade:  false,
                  };
                }
              }
              return updated;
            });
          }
        } catch {}
      }
    }
  }, [answers, shortAnswerTexts, timeLeft, id]);

  submitRef.current = doSubmit;

  // Self-grade handler
  const handleSelfGrade = useCallback(async (questionIndex, correct) => {
    setSGLoading(prev => new Set([...prev, questionIndex]));

    // Optimistic update
    setLocalResults(prev => {
      const updated = [...prev];
      if (updated[questionIndex]) {
        updated[questionIndex] = {
          ...updated[questionIndex],
          correct,
          self_grade:     correct,
          grading_method: 'self',
          pending_grade:  false,
        };
      }
      return updated;
    });

    try {
      const r = await fetch(`/api/v1/self-test/${id}/self-grade`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question_index: questionIndex, correct }),
      });
      if (r.ok) {
        const d = await r.json();
        if (d.combined_pct != null) setCombinedPct(d.combined_pct);
      }
    } catch {}

    setSGLoading(prev => { const s = new Set(prev); s.delete(questionIndex); return s; });
  }, [id]);

  // Timer
  useEffect(() => {
    if (state !== 'taking' || timeLeft === null) return;
    if (timeLeft <= 0) { submitRef.current?.(true); return; }

    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        const next = t - 1;
        if (next <= 0) { clearInterval(timerRef.current); submitRef.current?.(true); return 0; }
        return next;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [state]);

  const setAnswer   = (qi, val) => setAnswers(prev => ({ ...prev, [String(qi)]: val }));
  const setSAText   = (qi, val) => setSATexts(prev => ({ ...prev, [String(qi)]: val }));
  const toggleFlag  = (i) => setFlagged(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });

  const mcqAnswered  = questions.filter((q, i) => q.type !== 'short_answer' && answers[String(i)] !== undefined).length;
  const saAnswered   = questions.filter((q, i) => q.type === 'short_answer' && shortAnswerTexts[String(i)]?.trim()).length;
  const answeredCount = mcqAnswered + saAnswered;
  const unanswered   = questions.length - answeredCount;
  const isLowTime    = timeLeft !== null && timeLeft <= 120;

  // ── Loading ──────────────────────────────────────────────────────────────────
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
        <Link href="/self-test" className="text-sm text-primary hover:underline">← Back to Interview Prep</Link>
      </div>
    );
  }

  if (state === 'submitting') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-ds-textMuted">Scoring your test…</p>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────────
  if (state === 'results' && results) {
    const rawPct  = results.max_score > 0 ? Math.round((results.score / results.max_score) * 100) : 0;
    const displayPct = combinedPct ?? rawPct;
    const isJd    = session?.input_type === 'jd';
    const hasSA   = results.has_short_answers || localResults.some(r => r?.question_type === 'short_answer');

    const band = isJd
      ? (displayPct >= 80 ? { label: 'Strong Match',     cls: 'text-ds-success bg-ds-successLight border border-ds-success/30' }
       : displayPct >= 50 ? { label: 'Partial Match',     cls: 'text-amber-700 bg-amber-50 border border-amber-200' }
                          : { label: 'Needs Improvement', cls: 'text-ds-danger bg-ds-dangerLight border border-ds-danger/30' })
      : { label: displayPct >= 80 ? 'Great work!' : displayPct >= 60 ? 'Good effort!' : 'Keep practising!', cls: '' };

    // Per-skill breakdown (JD mode)
    const perSkill = isJd ? (() => {
      const map = {};
      (results.questions || []).forEach((q, i) => {
        if (!q.skill) return;
        if (!map[q.skill]) map[q.skill] = { correct: 0, total: 0 };
        map[q.skill].total++;
        if (localResults[i]?.correct) map[q.skill].correct++;
      });
      return Object.entries(map)
        .map(([name, { correct, total }]) => ({ name, correct, total, pct: total > 0 ? Math.round((correct / total) * 100) : 0 }))
        .sort((a, b) => b.pct - a.pct);
    })() : null;

    const pendingSelfGrade = localResults.some(r => r?.pending_grade && r?.grading_method === 'self');
    const pendingAIGrade   = localResults.some(r => r?.pending_grade && r?.grading_method === 'ai');

    const handleRetake = () => {
      if (session?.jd_skills) {
        try { sessionStorage.setItem('jd_retake', JSON.stringify({ skills: session.jd_skills, jdText: session.input_data || '' })); } catch {}
      }
      router.push('/self-test');
    };

    return (
      <div className="gradient-mesh-1 min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-6">
        {/* Score card */}
        <div className="card shadow-2xl p-6 text-center space-y-3">
          <p className="text-sm text-ds-textMuted font-medium uppercase tracking-wide">
            {hasSA && combinedPct != null ? 'Combined Score' : 'Your Score'}
          </p>
          <p className="text-5xl font-bold font-heading text-gradient-primary">{displayPct}%</p>
          {hasSA && combinedPct != null && (
            <p className="text-xs text-ds-textMuted">MCQ 60% + Short Answer 40% weighted</p>
          )}
          {!hasSA && (
            <p className="text-sm text-ds-textMuted">{results.score} / {results.max_score} points</p>
          )}
          {isJd && (
            <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${band.cls}`}>
              {band.label}
            </span>
          )}
          {!isJd && band.label && (
            <p className="text-sm text-ds-textMuted">{band.label}</p>
          )}
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

        {/* SA grading notice */}
        {pendingAIGrade && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <p className="text-sm text-blue-700">AI is grading your short answers — scores will update automatically.</p>
          </div>
        )}
        {pendingSelfGrade && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
            <p className="text-sm text-amber-700 font-medium">Self-grade required</p>
            <p className="text-xs text-amber-600 mt-0.5">Review each short answer below and mark whether you got it right.</p>
          </div>
        )}

        {/* Per-skill breakdown (JD mode) */}
        {isJd && perSkill && perSkill.length > 0 && (
          <div className="bg-ds-card border border-ds-border rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-ds-text">Skill Breakdown</h2>
            <div className="space-y-2">
              {perSkill.map(s => {
                const skillBand = s.pct >= 80
                  ? { cls: 'bg-ds-successLight', bar: 'bg-ds-success' }
                  : s.pct >= 50 ? { cls: 'bg-amber-50', bar: 'bg-amber-400' }
                  : { cls: 'bg-ds-dangerLight', bar: 'bg-ds-danger' };
                return (
                  <div key={s.name} className={`rounded-lg px-3 py-2.5 ${skillBand.cls}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-ds-text">{s.name}</span>
                      <span className="text-xs text-ds-textMuted">{s.correct}/{s.total} correct — {s.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${skillBand.bar}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Per-question breakdown */}
        <div className="space-y-3">
          {(results.questions || []).map((q, i) => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg p-4">
              {isJd && q.skill && (
                <p className="text-[10px] font-semibold text-ds-textMuted uppercase tracking-wide mb-2">{q.skill}</p>
              )}
              {q.type === 'short_answer' && (
                <span className="inline-block text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mb-2">Short Answer</span>
              )}
              <QuestionView
                question={q}
                index={i}
                answer={results.answers?.[String(i)]}
                onAnswer={() => {}}
                flagged={false}
                onFlag={() => {}}
                isResults
                result={localResults[i]}
                shortAnswerText={null}
                onShortAnswerChange={() => {}}
                selfGradeLoading={selfGradeLoading.has(i)}
                onSelfGrade={handleSelfGrade}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pb-6">
          {isJd ? (
            <>
              <button onClick={handleRetake}
                className="btn-primary flex-1 text-center py-2.5 rounded-btn text-sm font-semibold">
                Retake Test
              </button>
              <button onClick={() => router.push('/self-test')}
                className="flex-1 text-center py-2.5 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
                Try Different JD
              </button>
            </>
          ) : (
            <>
              <Link href="/self-test"
                className="btn-primary flex-1 text-center py-2.5 rounded-btn text-sm font-semibold">
                Practice Again
              </Link>
              <Link href="/builder"
                className="flex-1 text-center py-2.5 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
                Back to Builder
              </Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Taking ───────────────────────────────────────────────────────────────────
  const q = questions[current];

  return (
    <div className="gradient-mesh-1 min-h-screen px-4 py-6 max-w-2xl mx-auto space-y-4">
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
          <span className={`font-mono font-bold text-lg ${isLowTime ? 'text-ds-danger animate-pulse-glow' : 'text-ds-text'}`}>
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

      {submitError && (
        <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2.5 flex items-center justify-between">
          <span>{submitError}</span>
          <button onClick={() => doSubmit(false)} className="text-xs font-semibold underline ml-3 flex-shrink-0">Try Again</button>
        </div>
      )}

      {/* Question card */}
      <div className="bg-ds-card border border-ds-border rounded-lg p-5">
        {q && (
          <>
            {q.type === 'short_answer' && (
              <span className="inline-block text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded mb-3">Short Answer · 2 pts</span>
            )}
            <QuestionView
              question={q}
              index={current}
              answer={answers[String(current)]}
              onAnswer={val => setAnswer(current, val)}
              flagged={flagged.has(current)}
              onFlag={() => toggleFlag(current)}
              isResults={false}
              result={null}
              shortAnswerText={shortAnswerTexts[String(current)] || ''}
              onShortAnswerChange={val => setSAText(current, val)}
              selfGradeLoading={false}
              onSelfGrade={() => {}}
            />
          </>
        )}
      </div>

      {/* Navigation */}
      <div className="bg-ds-card border border-ds-border rounded-lg px-4 py-3 space-y-3">
        {/* Question number pills */}
        <div className="flex flex-wrap gap-1.5">
          {questions.map((qItem, i) => {
            const isSAQ     = qItem.type === 'short_answer';
            const isAnswered = isSAQ
              ? !!shortAnswerTexts[String(i)]?.trim()
              : answers[String(i)] !== undefined;
            const isFlagged = flagged.has(i);
            const isCurrent = i === current;

            let pillCls;
            if (isCurrent) {
              pillCls = isSAQ
                ? 'bg-amber-500 text-white'
                : 'bg-[var(--c-primary)] text-white';
            } else if (isAnswered) {
              pillCls = isSAQ
                ? 'bg-amber-400 text-white opacity-80'
                : 'bg-[var(--c-primary)] text-white opacity-70';
            } else {
              pillCls = 'bg-ds-bg text-ds-textMuted border border-ds-border hover:border-primary hover:text-primary';
            }

            return (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                title={isFlagged ? 'Flagged' : isAnswered ? 'Answered' : 'Unanswered'}
                className={`w-8 h-8 rounded text-xs font-semibold transition-colors relative ${pillCls}`}
              >
                {i + 1}
                {isFlagged && (
                  <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-400 rounded-full border border-white" />
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
            className="btn-primary px-5 py-2 rounded-btn text-sm font-semibold"
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

      {/* Submit confirmation */}
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
                className="btn-primary flex-1 py-2 rounded-btn text-sm font-semibold"
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

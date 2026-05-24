'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const DIFF_COLORS = {
  easy:   'bg-green-50  dark:bg-green-900/30  text-green-700  dark:text-green-400  border-green-200  dark:border-green-700/50',
  medium: 'bg-amber-50  dark:bg-amber-900/30  text-amber-700  dark:text-amber-400  border-amber-200  dark:border-amber-700/50',
  hard:   'bg-red-50    dark:bg-red-900/30    text-red-700    dark:text-red-400    border-red-200    dark:border-red-700/50',
};

const DIFF_CHIP = {
  easy:   { bg: '#D1FAE5', color: '#1D9E75' },
  medium: { bg: '#FEF3C7', color: '#B45309' },
  hard:   { bg: '#FEE2E2', color: '#D93025' },
};

function formatTime(seconds) {
  if (seconds == null || seconds < 0) seconds = 0;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
function FlagIcon({ filled }) {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/>
      <line x1="4" y1="22" x2="4" y2="15"/>
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
      <polyline points="17 21 17 13 7 13 7 21"/>
      <polyline points="7 3 7 8 15 8"/>
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  );
}

function AlarmIcon({ color }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="13" r="8"/>
      <path d="M12 9v4l2 2"/>
      <path d="M5 3L2 6M22 6l-3-3"/>
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}

// ─── Results-mode question view (unchanged) ───────────────────────────────────
function QuestionView({ question, index, answer, onAnswer, flagged, onFlag, isResults, result, shortAnswerText, onShortAnswerChange }) {
  const isSA = question.type === 'short_answer';

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-ds-text leading-relaxed flex-1">
          <span className="text-ds-textMuted font-normal mr-1.5">Q{index + 1}.</span>
          {question.question_text}
        </p>
        {!isResults && (
          <button onClick={onFlag} title={flagged ? 'Remove flag' : 'Flag for review'}
            className={`flex-shrink-0 mt-0.5 p-1.5 rounded transition-colors ${flagged ? 'text-amber-600 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50' : 'text-ds-textMuted hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'}`}>
            <FlagIcon filled={flagged} />
          </button>
        )}
        {isResults && result && !isSA && (
          <span className={`flex-shrink-0 text-xs font-semibold px-2 py-0.5 rounded ${result.correct ? 'chip-success' : 'chip-error'}`}>
            {result.correct ? '✓ Correct' : '✗ Wrong'}
          </span>
        )}
        {isResults && result && isSA && (
          <span title="Short answer questions are for practice only" className="flex-shrink-0 text-[11px] font-medium px-2 py-0.5 rounded bg-[#F3F4F6] dark:bg-white/10 text-[#9CA3AF]">
            Not scored
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
              <button key={i} disabled={isResults} onClick={() => !isResults && onAnswer(String(i))}
                className={`w-full text-left flex items-center gap-3 px-4 py-3 rounded-lg border text-sm transition-colors ${cls} ${!isResults ? 'hover:border-primary hover:bg-primary/5' : ''}`}>
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
              <button key={v} disabled={isResults} onClick={() => !isResults && onAnswer(v)}
                className={`py-3 rounded-lg border text-sm font-semibold transition-colors capitalize ${cls} ${!isResults ? 'hover:border-primary hover:bg-primary/5' : ''}`}>
                {v}
              </button>
            );
          })}
        </div>
      )}

      {isSA && !isResults && (
        <div className="space-y-1.5">
          <textarea value={shortAnswerText || ''} onChange={e => onShortAnswerChange(e.target.value)}
            rows={5} placeholder="Write your answer here…"
            className="w-full px-3 py-2.5 text-sm border border-ds-inputBorder rounded-lg bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted resize-none leading-relaxed"
            style={{ minHeight: '120px' }} />
          <div className="flex items-center justify-between">
            <p className="text-xs text-ds-textMuted">Write 2–6 sentences for full marks</p>
            <p className="text-xs text-ds-textMuted">{(shortAnswerText || '').trim().split(/\s+/).filter(Boolean).length} words</p>
          </div>
        </div>
      )}

      {isSA && isResults && (
        <div className="space-y-3">
          <div className="bg-ds-bg border border-ds-border rounded-lg px-3 py-2.5">
            <p className="text-[10px] font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Your Answer</p>
            {result?.short_answer_text
              ? <p className="text-sm italic text-ds-text leading-relaxed whitespace-pre-wrap">{result.short_answer_text}</p>
              : <p className="text-sm italic text-ds-textMuted">No answer provided</p>
            }
          </div>
          {question.model_answer && (
            <div className="bg-green-50 dark:bg-green-900/30 border-l-4 border-green-400 dark:border-green-500 rounded-lg px-3 py-2.5">
              <p className="text-[10px] font-semibold text-green-700 dark:text-green-400 uppercase tracking-wide mb-1.5">Model Answer</p>
              <p className="text-sm text-green-800 dark:text-green-200 leading-relaxed">{question.model_answer}</p>
            </div>
          )}
        </div>
      )}

      {isResults && question.explanation && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 rounded-lg px-3 py-2.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span className="text-sm leading-none">💡</span>
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">Explanation</span>
          </div>
          <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">{question.explanation}</p>
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

  const [state, setState]              = useState('loading');
  const [session, setSession]          = useState(null);
  const [questions, setQuestions]      = useState([]);
  const [answers, setAnswers]          = useState({});
  const [shortAnswerTexts, setSATexts] = useState({});
  const [flagged, setFlagged]          = useState(new Set());
  const [visited, setVisited]          = useState(new Set([0]));
  const [current, setCurrent]          = useState(0);
  const [timeLeft, setTimeLeft]        = useState(null);
  const [qTimeElapsed, setQTimeElapsed] = useState(0);
  const [submitError, setSubmitError]  = useState('');
  const [confirmOpen, setConfirmOpen]  = useState(false);
  const [results, setResults]          = useState(null);
  const [localResults, setLocalResults] = useState([]);
  const [combinedPct, setCombinedPct]  = useState(null);
  const [connBanner, setConnBanner]    = useState(false);

  const timerRef  = useRef(null);
  const submitRef = useRef(null);

  // Navigate and mark visited
  const navigateTo = useCallback((i) => {
    setCurrent(i);
    setVisited(v => { const s = new Set(v); s.add(i); return s; });
  }, []);

  // Per-question countdown timer
  const totalSecs = session ? session.timer_minutes * 60 : 0;
  const perQSecs  = session
    ? Math.max(30, Math.floor((session.timer_minutes * 60) / Math.max(questions.length, 1)))
    : 60;
  const qTimeLeft = Math.max(0, perQSecs - qTimeElapsed);

  useEffect(() => {
    if (state !== 'taking') return;
    setQTimeElapsed(0);
    const interval = setInterval(() => setQTimeElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [current, state]);

  // Mark current question as visited whenever it changes
  useEffect(() => {
    setVisited(v => { const s = new Set(v); s.add(current); return s; });
  }, [current]);

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
          const attemptResults = d.attempt.results || [];
          setResults({
            score:      d.attempt.score,
            max_score:  d.attempt.max_score,
            results:    attemptResults,
            questions:  d.questions,
            answers:    d.attempt.answers,
            auto_submitted: d.attempt.auto_submitted,
            has_short_answers: attemptResults.some(r => r?.question_type === 'short_answer'),
          });
          setLocalResults([...attemptResults]);
          if (d.attempt.combined_pct != null) setCombinedPct(d.attempt.combined_pct);
          setState('results');
          return;
        }

        const saved = localStorage.getItem(LS_KEY);
        if (saved) {
          try {
            const { answers: sa, shortAnswerTexts: sat, timeLeft: st, flagged: sf, visited: sv } = JSON.parse(saved);
            if (sa)  { setAnswers(sa); setVisited(new Set([0, ...Object.keys(sa).map(Number)])); }
            if (sat) setSATexts(sat);
            if (st > 0) setTimeLeft(st);
            else setTimeLeft(d.session.timer_minutes * 60);
            if (sf) setFlagged(new Set(sf));
            if (sv) setVisited(prev => { const s = new Set(prev); sv.forEach(i => s.add(i)); return s; });
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
      localStorage.setItem(LS_KEY, JSON.stringify({
        answers, shortAnswerTexts, timeLeft,
        flagged: [...flagged], visited: [...visited],
      }));
    }
  }, [answers, shortAnswerTexts, timeLeft, flagged, visited, state]);

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
      setSubmitError('We had trouble saving your test. Your answers have been preserved — please try submitting again.');
      return;
    }

    const d = await r.json();
    localStorage.removeItem(LS_KEY);

    setResults({
      score:      d.score,
      max_score:  d.max_score,
      results:    d.results,
      questions:  d.questions,
      answers,
      auto_submitted: auto,
      has_short_answers: d.has_short_answers,
    });
    setLocalResults([...(d.results || [])]);
    setState('results');
  }, [answers, shortAnswerTexts, timeLeft, id]);

  submitRef.current = doSubmit;

  // Global timer
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

  // Keyboard shortcuts
  const currentRef   = useRef(current);
  const questionsRef = useRef(questions);
  const answersRef   = useRef(answers);
  currentRef.current   = current;
  questionsRef.current = questions;
  answersRef.current   = answers;

  useEffect(() => {
    if (state !== 'taking') return;
    const handleKey = (e) => {
      if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
      const cur = currentRef.current;
      const qs  = questionsRef.current;
      const ans = answersRef.current;
      const q   = qs[cur];

      if (e.key === 'ArrowLeft'  && cur > 0)           navigateTo(cur - 1);
      if (e.key === 'ArrowRight' && cur < qs.length - 1) navigateTo(cur + 1);
      if (e.key === 'f' || e.key === 'F') {
        setFlagged(prev => { const s = new Set(prev); s.has(cur) ? s.delete(cur) : s.add(cur); return s; });
      }
      if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
        if (ans[String(cur)] !== undefined && cur < qs.length - 1) navigateTo(cur + 1);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        setConfirmOpen(true);
      }
      if (q?.type === 'mcq') {
        const byNum = '1234'.indexOf(e.key);
        if (byNum !== -1 && q.options?.[byNum]) setAnswers(prev => ({ ...prev, [String(cur)]: String(byNum) }));
        const byLet = 'abcd'.indexOf(e.key.toLowerCase());
        if (byLet !== -1 && q.options?.[byLet]) setAnswers(prev => ({ ...prev, [String(cur)]: String(byLet) }));
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [state, navigateTo]);

  const setAnswer  = (qi, val) => setAnswers(prev => ({ ...prev, [String(qi)]: val }));
  const setSAText  = (qi, val) => setSATexts(prev => ({ ...prev, [String(qi)]: val }));
  const toggleFlag = (i) => setFlagged(prev => { const s = new Set(prev); s.has(i) ? s.delete(i) : s.add(i); return s; });
  const saveAndExit = () => router.push('/self-test');

  const answeredCount = questions.filter((q, i) =>
    q.type === 'short_answer'
      ? !!shortAnswerTexts[String(i)]?.trim()
      : answers[String(i)] !== undefined
  ).length;
  const unanswered = questions.length - answeredCount;
  const timeUsedPct = totalSecs > 0 && timeLeft !== null
    ? Math.min(100, Math.round(((totalSecs - timeLeft) / totalSecs) * 100))
    : 0;

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
    const displayPct  = combinedPct ?? (results.max_score > 0 ? Math.round((results.score / results.max_score) * 100) : 0);
    const isJd        = session?.input_type === 'jd';
    const hasSA       = results.has_short_answers || localResults.some(r => r?.question_type === 'short_answer');
    const saCount     = localResults.filter(r => r?.question_type === 'short_answer').length;
    const scoredCount = localResults.filter(r => r?.question_type !== 'short_answer').length;

    const band = isJd
      ? (displayPct >= 80 ? { label: 'Strong Match',     cls: 'text-ds-success bg-ds-successLight border border-ds-success/30' }
       : displayPct >= 50 ? { label: 'Partial Match',     cls: 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50' }
                          : { label: 'Needs Improvement', cls: 'text-ds-danger bg-ds-dangerLight border border-ds-danger/30' })
      : { label: displayPct >= 80 ? 'Great work!' : displayPct >= 60 ? 'Good effort!' : 'Keep practising!', cls: '' };

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

    const handleRetake = () => {
      if (session?.jd_skills) {
        try { sessionStorage.setItem('jd_retake', JSON.stringify({ skills: session.jd_skills, jdText: session.input_data || '' })); } catch {}
      }
      router.push('/self-test');
    };

    return (
      <div className="gradient-mesh-1 min-h-screen px-4 sm:px-6 lg:px-8 py-6 w-full space-y-6">
        <div className="max-w-2xl mx-auto mb-8 space-y-4">
          <div className="card card-featured shadow-2xl p-6 text-center space-y-3">
            <p className="text-sm text-ds-textMuted font-medium uppercase tracking-wide">Your Score</p>
            <p className="text-5xl font-bold font-heading text-gradient-primary">{displayPct}%</p>
            <p className="text-sm text-ds-textMuted">
              {results.score} / {results.max_score} scored question{scoredCount !== 1 ? 's' : ''}
            </p>
            {hasSA && (
              <p className="text-xs text-[#9CA3AF] mt-1">
                {saCount} short answer question{saCount !== 1 ? 's' : ''} not included in score — review model answers below
              </p>
            )}
            {isJd && (
              <span className={`inline-block text-xs font-semibold px-3 py-1 rounded-full ${band.cls}`}>
                {band.label}
              </span>
            )}
            {!isJd && band.label && <p className="text-sm text-ds-textMuted">{band.label}</p>}
            {results.auto_submitted && (
              <span className="inline-block text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700/50 px-2.5 py-1 rounded">
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
        </div>

        {isJd && perSkill && perSkill.length > 0 && (
          <div className="bg-ds-card border border-ds-border rounded-lg p-5 space-y-3">
            <h2 className="text-sm font-semibold text-ds-text">Skill Breakdown</h2>
            <div className="space-y-2">
              {perSkill.map(s => {
                const skillBand = s.pct >= 80
                  ? { cls: 'bg-ds-successLight', bar: 'bg-ds-success' }
                  : s.pct >= 50 ? { cls: 'bg-amber-50 dark:bg-amber-900/30', bar: 'bg-amber-400' }
                  : { cls: 'bg-ds-dangerLight', bar: 'bg-ds-danger' };
                return (
                  <div key={s.name} className={`rounded-lg px-3 py-2.5 ${skillBand.cls}`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-sm font-medium text-ds-text">{s.name}</span>
                      <span className="text-xs text-ds-textMuted">{s.correct}/{s.total} correct — {s.pct}%</span>
                    </div>
                    <div className="h-1.5 bg-black/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${s.pct >= 80 ? 'progress-fill-gradient' : skillBand.bar}`} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {(results.questions || []).map((q, i) => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg p-4">
              {isJd && q.skill && (
                <p className="text-[10px] font-semibold text-ds-textMuted uppercase tracking-wide mb-2">{q.skill}</p>
              )}
              {q.type === 'short_answer' && (
                <span className="inline-block text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 px-1.5 py-0.5 rounded mb-2">Short Answer</span>
              )}
              <QuestionView
                question={q} index={i}
                answer={results.answers?.[String(i)]}
                onAnswer={() => {}} flagged={false} onFlag={() => {}}
                isResults result={localResults[i]}
                shortAnswerText={null} onShortAnswerChange={() => {}}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3 pb-6">
          {isJd ? (
            <>
              <button onClick={handleRetake} className="btn-primary flex-1 text-center py-2.5 rounded-btn text-sm font-semibold">Retake Test</button>
              <button onClick={() => router.push('/self-test')} className="flex-1 text-center py-2.5 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">Try Different JD</button>
            </>
          ) : (
            <>
              <Link href="/self-test" className="btn-primary flex-1 text-center py-2.5 rounded-btn text-sm font-semibold">Practice Again</Link>
              <Link href="/builder" className="flex-1 text-center py-2.5 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">Back to Builder</Link>
            </>
          )}
        </div>
      </div>
    );
  }

  // ── Taking — new redesigned UI ────────────────────────────────────────────────
  const q = questions[current];
  const isLowGlobalTime = timeLeft !== null && timeLeft < totalSecs * 0.1;
  const isAmberGlobalTime = timeLeft !== null && timeLeft < totalSecs * 0.2;
  const timeColor = isLowGlobalTime ? '#D93025' : isAmberGlobalTime ? '#B45309' : '#6B7280';
  const diffChip = DIFF_CHIP[session?.difficulty] || { bg: '#F4F8FC', color: '#6B7280' };

  return (
    <div className="bg-[#F4F8FC] dark:bg-[#0A1628] min-h-screen">
      {/* ── Fixed top: progress bar + info row ─────────────────────────────── */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="h-1.5 bg-[rgba(29,158,117,0.15)]">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${Math.round((current / Math.max(questions.length, 1)) * 100)}%`,
              background: 'linear-gradient(90deg, #1D9E75, #185FA5)',
            }}
          />
        </div>
        <div className="flex items-center justify-between px-6 py-2.5 bg-[#F4F8FC] dark:bg-[#0A1628] border-b border-[#D1DCE8] dark:border-white/10">
          <span className="text-[13px] font-medium text-[#6B7280]">
            Question {current + 1} of {questions.length}
          </span>
          <span className="text-[13px] font-medium" style={{ color: timeColor }}>
            {timeLeft !== null ? formatTime(timeLeft) : '--:--'} remaining · {timeUsedPct}% of time used
          </span>
        </div>
      </div>

      {/* ── Scrollable body ─────────────────────────────────────────────────── */}
      <div style={{ paddingTop: 52, paddingBottom: 80 }}>
        {/* Connection banner */}
        {connBanner && (
          <div className="max-w-[780px] mx-auto px-4 pt-3">
            <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700/50 text-amber-800 dark:text-amber-300 text-xs px-4 py-2.5 rounded-lg flex items-center justify-between">
              <span>Connection issue detected. Your progress is being saved locally.</span>
              <button onClick={() => setConnBanner(false)} className="text-amber-600 dark:text-amber-400 hover:text-amber-800 ml-3">×</button>
            </div>
          </div>
        )}

        {/* Submit error */}
        {submitError && (
          <div className="max-w-[780px] mx-auto px-4 pt-3">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700/50 text-red-700 dark:text-red-400 text-sm rounded-lg px-4 py-2.5 flex items-center justify-between">
              <span>{submitError}</span>
              <button onClick={() => doSubmit(false)} className="text-xs font-semibold underline ml-3 flex-shrink-0">Try Again</button>
            </div>
          </div>
        )}

        {/* ── Question card ──────────────────────────────────────────────────── */}
        <div className="max-w-[780px] mx-auto px-4 pt-4">
          <div
            className="bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-2xl overflow-hidden"
            style={{ boxShadow: '0 2px 12px rgba(12,68,124,0.08)' }}
          >
            {/* Card header: Save and exit / Submit quiz */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#D1DCE8] dark:border-white/10">
              <button
                onClick={saveAndExit}
                className="flex items-center gap-1.5 text-[13px] text-[#6B7280] border border-[#D1DCE8] dark:border-white/20 rounded-[10px] px-3.5 py-1.5 bg-white dark:bg-transparent hover:border-[#185FA5] hover:text-[#185FA5] transition-colors"
              >
                <SaveIcon /> Save and exit
              </button>
              <button
                onClick={() => setConfirmOpen(true)}
                className="flex items-center gap-1.5 text-[13px] font-semibold text-white rounded-[10px] px-4 py-1.5 transition-colors"
                style={{ background: '#1D9E75' }}
                onMouseOver={e => e.currentTarget.style.background = '#15803D'}
                onMouseOut={e => e.currentTarget.style.background = '#1D9E75'}
              >
                <CheckCircleIcon /> Submit quiz
              </button>
            </div>

            {/* Question meta row */}
            {q && (
              <div className="flex items-center justify-between px-5 pt-5 gap-2 flex-wrap">
                {/* Left: Q N + skill + difficulty */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[13px] font-semibold text-[#9CA3AF]">Q {current + 1}</span>
                  {q.skill && (
                    <span className="text-[12px] px-2.5 py-0.5 rounded-full"
                      style={{ background: '#E6F1FB', color: '#185FA5', border: '1px solid rgba(24,95,165,0.20)' }}>
                      {q.skill}
                    </span>
                  )}
                  <span className="text-[12px] px-2.5 py-0.5 rounded-full capitalize"
                    style={{ background: diffChip.bg, color: diffChip.color }}>
                    {session?.difficulty}
                  </span>
                </div>

                {/* Right: per-question timer + flag */}
                <div className="flex items-center gap-2">
                  <div
                    className="flex items-center gap-1.5 rounded-full px-3 py-1"
                    style={{
                      background: qTimeLeft < 30 ? 'rgba(217,48,37,0.10)' : '#FEF3C7',
                      border: `1px solid ${qTimeLeft < 30 ? 'rgba(217,48,37,0.30)' : 'rgba(245,158,11,0.30)'}`,
                    }}
                  >
                    <AlarmIcon color={qTimeLeft < 30 ? '#D93025' : '#B45309'} />
                    <span
                      className="text-[13px] font-semibold font-mono"
                      style={{ color: qTimeLeft < 30 ? '#D93025' : '#B45309' }}
                    >
                      {formatTime(qTimeLeft)}
                    </span>
                  </div>
                  <button
                    onClick={() => toggleFlag(current)}
                    className="flex items-center gap-1.5 text-[12px] rounded-full px-3 py-1 transition-colors"
                    style={{
                      background: flagged.has(current) ? '#FEF3C7' : 'white',
                      border: `1px solid ${flagged.has(current) ? '#F59E0B' : '#D1DCE8'}`,
                      color: flagged.has(current) ? '#B45309' : '#6B7280',
                    }}
                  >
                    <span style={{ color: flagged.has(current) ? '#F59E0B' : '#9CA3AF' }}>
                      <FlagIcon filled={flagged.has(current)} />
                    </span>
                    {flagged.has(current) ? 'Flagged' : 'Flag for review'}
                  </button>
                </div>
              </div>
            )}

            {/* Question text */}
            {q && (
              <div className="px-5 py-4">
                <p className="text-[16px] font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] leading-relaxed">
                  {q.question_text}
                </p>
              </div>
            )}

            {/* Answer options */}
            {q && (
              <div className="px-5 pb-2">
                {/* MCQ */}
                {q.type === 'mcq' && (
                  <div className="flex flex-col gap-2.5">
                    {(q.options || []).map((opt, i) => {
                      const letter = String.fromCharCode(65 + i);
                      const isSelected = answers[String(current)] === String(i);
                      return (
                        <button
                          key={i}
                          onClick={() => setAnswer(current, String(i))}
                          className="w-full text-left flex items-center gap-3.5 rounded-[12px] transition-all duration-180 group"
                          style={{
                            border: isSelected ? '2px solid #185FA5' : '1.5px solid #D1DCE8',
                            padding: '14px 16px',
                            background: isSelected
                              ? 'linear-gradient(135deg, #E6F1FB, #F4F8FC)'
                              : 'white',
                          }}
                          onMouseOver={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(24,95,165,0.40)'; e.currentTarget.style.background = 'rgba(24,95,165,0.03)'; }}}
                          onMouseOut={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#D1DCE8'; e.currentTarget.style.background = 'white'; }}}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            background: isSelected ? '#185FA5' : '#F4F8FC',
                            border: `1px solid ${isSelected ? '#185FA5' : '#D1DCE8'}`,
                            display: 'grid', placeItems: 'center',
                            fontSize: 13, fontWeight: 700,
                            color: isSelected ? 'white' : '#6B7280',
                          }}>
                            {letter}
                          </div>
                          <span className="flex-1 text-[15px] leading-relaxed text-[#2C2C2A] dark:text-[#E8EFF7]"
                            style={{ fontWeight: isSelected ? 500 : 400 }}>
                            {opt.option_text}
                          </span>
                          {isSelected && <CheckIcon />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* True/False */}
                {q.type === 'true_false' && (
                  <div className="flex gap-2.5">
                    {['true', 'false'].map((v, i) => {
                      const isSelected = answers[String(current)] === v;
                      return (
                        <button
                          key={v}
                          onClick={() => setAnswer(current, v)}
                          className="flex-1 flex items-center gap-3.5 rounded-[12px] transition-all duration-180"
                          style={{
                            border: isSelected ? '2px solid #185FA5' : '1.5px solid #D1DCE8',
                            padding: '14px 16px',
                            background: isSelected ? 'linear-gradient(135deg, #E6F1FB, #F4F8FC)' : 'white',
                          }}
                          onMouseOver={e => { if (!isSelected) { e.currentTarget.style.borderColor = 'rgba(24,95,165,0.40)'; e.currentTarget.style.background = 'rgba(24,95,165,0.03)'; }}}
                          onMouseOut={e => { if (!isSelected) { e.currentTarget.style.borderColor = '#D1DCE8'; e.currentTarget.style.background = 'white'; }}}
                        >
                          <div style={{
                            width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                            background: isSelected ? '#185FA5' : '#F4F8FC',
                            border: `1px solid ${isSelected ? '#185FA5' : '#D1DCE8'}`,
                            display: 'grid', placeItems: 'center',
                            fontSize: 13, fontWeight: 700,
                            color: isSelected ? 'white' : '#6B7280',
                          }}>
                            {v === 'true' ? 'T' : 'F'}
                          </div>
                          <span className="text-[15px] capitalize text-[#2C2C2A] dark:text-[#E8EFF7]"
                            style={{ fontWeight: isSelected ? 500 : 400 }}>
                            {v}
                          </span>
                          {isSelected && <CheckIcon />}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Short Answer */}
                {q.type === 'short_answer' && (
                  <div className="flex flex-col gap-2">
                    <textarea
                      value={shortAnswerTexts[String(current)] || ''}
                      onChange={e => setSAText(current, e.target.value)}
                      placeholder="Write your answer here..."
                      className="w-full text-[15px] text-[#2C2C2A] dark:text-[#E8EFF7] bg-white dark:bg-[#0F1A2E] outline-none resize-vertical leading-[1.7] placeholder-[#9CA3AF]"
                      style={{
                        minHeight: 120, border: '1.5px solid #D1DCE8', borderRadius: 12,
                        padding: '14px 16px', boxSizing: 'border-box', fontFamily: 'inherit',
                      }}
                      onFocus={e => { e.target.style.borderColor = '#185FA5'; e.target.style.boxShadow = '0 0 0 3px rgba(24,95,165,0.10)'; }}
                      onBlur={e => { e.target.style.borderColor = '#D1DCE8'; e.target.style.boxShadow = 'none'; }}
                    />
                    <div className="flex items-center justify-end">
                      <span className="text-[12px] text-[#9CA3AF]">
                        {wordCount(shortAnswerTexts[String(current)] || '')} words
                      </span>
                    </div>
                    <p className="text-[12px] text-[#9CA3AF] italic">
                      ℹ Short answer questions are for practice — no score is given
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Card footer: Previous / Next */}
            <div className="flex items-center justify-between px-5 py-5 border-t border-[#D1DCE8] dark:border-white/10 mt-4">
              <button
                disabled={current === 0}
                onClick={() => navigateTo(current - 1)}
                className="flex items-center gap-1.5 text-[14px] text-[#6B7280] border border-[#D1DCE8] dark:border-white/20 rounded-[10px] px-4 py-2 bg-white dark:bg-transparent hover:border-[#185FA5] hover:text-[#185FA5] transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-[#D1DCE8] disabled:hover:text-[#6B7280]"
              >
                <ArrowLeftIcon /> Previous
              </button>
              <button
                onClick={() => {
                  if (current === questions.length - 1) setConfirmOpen(true);
                  else navigateTo(current + 1);
                }}
                className="flex items-center gap-1.5 text-[14px] font-semibold text-white rounded-[10px] px-5 py-2 transition-colors"
                style={{ background: '#185FA5' }}
                onMouseOver={e => e.currentTarget.style.background = '#0C447C'}
                onMouseOut={e => e.currentTarget.style.background = '#185FA5'}
              >
                {current === questions.length - 1 ? 'Review & Submit' : 'Next'}
                {current !== questions.length - 1 && <ArrowRightIcon />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Fixed bottom: question navigation dots ────────────────────────────── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white dark:bg-[#111F35] border-t border-[#D1DCE8] dark:border-white/10 px-6 py-3 flex justify-center items-center gap-1.5 flex-wrap">
        {questions.map((qItem, i) => {
          const isSAQ      = qItem.type === 'short_answer';
          const isAnswered = isSAQ
            ? !!shortAnswerTexts[String(i)]?.trim()
            : answers[String(i)] !== undefined;
          const isFlagged  = flagged.has(i);
          const isCurrent  = i === current;
          const isVisited  = visited.has(i);

          let bg = 'white', color = '#9CA3AF', borderStyle = '1.5px solid #D1DCE8', shadow = '';

          if (isCurrent) {
            bg = '#185FA5'; color = 'white'; borderStyle = '1.5px solid #185FA5';
            shadow = '0 0 0 3px rgba(24,95,165,0.20)';
          } else if (isAnswered) {
            bg = isSAQ ? '#8B5CF6' : '#1D9E75';
            color = 'white';
            borderStyle = `1.5px solid ${isSAQ ? '#8B5CF6' : '#1D9E75'}`;
          } else if (isVisited) {
            bg = 'white'; color = '#D93025'; borderStyle = '2px dashed #D93025';
          }

          return (
            <button
              key={i}
              onClick={() => navigateTo(i)}
              title={isFlagged ? 'Flagged' : isAnswered ? 'Answered' : isVisited ? 'Skipped' : 'Not visited'}
              className="relative transition-all duration-150"
              style={{
                width: 32, height: 32, borderRadius: '9999px',
                fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: bg, color, border: borderStyle, boxShadow: shadow,
              }}
            >
              {i + 1}
              {isFlagged && (
                <span
                  className="absolute"
                  style={{
                    top: -2, right: -2, width: 8, height: 8,
                    borderRadius: '9999px', background: '#F59E0B', border: '1.5px solid white',
                  }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* ── Submit confirmation ────────────────────────────────────────────────── */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setConfirmOpen(false)} />
          <div className="relative bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-heading font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">Submit Test?</h3>
            {unanswered > 0 ? (
              <p className="text-sm text-[#2C2C2A] dark:text-[#E8EFF7]">
                You have{' '}
                <span className="font-semibold text-red-600">{unanswered} unanswered question{unanswered !== 1 ? 's' : ''}</span>.
                {' '}Submit anyway?
              </p>
            ) : (
              <p className="text-sm text-[#2C2C2A] dark:text-[#E8EFF7]">All questions answered. Ready to submit?</p>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setConfirmOpen(false); doSubmit(false); }}
                className="flex-1 py-2 rounded-[10px] text-sm font-semibold text-white transition-colors"
                style={{ background: '#1D9E75' }}
              >
                Yes, Submit
              </button>
              <button
                onClick={() => setConfirmOpen(false)}
                className="flex-1 py-2 rounded-[10px] text-sm font-medium text-[#6B7280] border border-[#D1DCE8] dark:border-white/20 hover:bg-[#F4F8FC] dark:hover:bg-white/5 transition-colors"
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

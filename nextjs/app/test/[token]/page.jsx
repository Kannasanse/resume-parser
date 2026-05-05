'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ─── Timer component ──────────────────────────────────────────────────────────
function Timer({ secondsLeft, onExpire }) {
  const mins = Math.floor(secondsLeft / 60);
  const secs = secondsLeft % 60;
  const isWarning = secondsLeft <= 300 && secondsLeft > 60;
  const isDanger  = secondsLeft <= 60;

  useEffect(() => {
    if (secondsLeft <= 0) onExpire();
  }, [secondsLeft, onExpire]);

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-mono font-semibold border ${
      isDanger  ? 'bg-red-50 text-red-600 border-red-200 animate-pulse' :
      isWarning ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
      'bg-white text-gray-700 border-gray-200'
    }`}>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
      </svg>
      {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
    </div>
  );
}

// ─── Question renderer ────────────────────────────────────────────────────────
function QuestionView({ question, index, response, onChange }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1">
          <p className="text-gray-900 font-medium leading-relaxed">{question.question_text}</p>
          <span className="text-xs text-gray-400 mt-0.5 inline-block">
            {question.points} pt{question.points !== 1 ? 's' : ''} ·{' '}
            {question.type === 'mcq' ? 'Multiple choice' : question.type === 'true_false' ? 'True / False' : 'Short answer'}
          </span>
        </div>
      </div>

      {/* MCQ or True/False */}
      {(question.type === 'mcq' || question.type === 'true_false') && (
        <div className="pl-10 space-y-2">
          {question.test_options.map(opt => (
            <label key={opt.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors select-none ${
                response?.selected_option_id === opt.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}>
              <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                response?.selected_option_id === opt.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'
              }`}>
                {response?.selected_option_id === opt.id && (
                  <div className="w-1.5 h-1.5 rounded-full bg-white" />
                )}
              </div>
              <input type="radio" className="sr-only"
                name={`q-${question.id}`}
                value={opt.id}
                checked={response?.selected_option_id === opt.id}
                onChange={() => onChange(question.id, { selected_option_id: opt.id })}
              />
              <span className="text-sm text-gray-800">{opt.option_text}</span>
            </label>
          ))}
        </div>
      )}

      {/* Short answer */}
      {question.type === 'short_answer' && (
        <div className="pl-10">
          <textarea
            value={response?.text_response || ''}
            onChange={e => onChange(question.id, { text_response: e.target.value })}
            placeholder="Type your answer here…"
            rows={4}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 placeholder-gray-400 resize-none"
          />
        </div>
      )}
    </div>
  );
}

// ─── Error screens ────────────────────────────────────────────────────────────
function ErrorScreen({ type }) {
  const messages = {
    REVOKED:    { title: 'Link Revoked', body: 'This test link has been revoked. Please contact the person who sent it.' },
    COMPLETED:  { title: 'Already Submitted', body: 'You have already completed this test.' },
    EXPIRED:    { title: 'Link Expired', body: 'This test link has expired. Please contact the sender for a new link.' },
    NOT_FOUND:  { title: 'Not Found', body: 'This test link is invalid or does not exist.' },
    GENERIC:    { title: 'Something Went Wrong', body: 'An unexpected error occurred. Please try again.' },
  };
  const { title, body } = messages[type] || messages.GENERIC;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-md w-full text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{body}</p>
      </div>
    </div>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────
function CompletionScreen({ score, maxScore, autoSubmitted }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Test Submitted!</h1>
        {autoSubmitted && (
          <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            The test was automatically submitted when the time expired.
          </p>
        )}
        {score !== null && score !== undefined ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-4">
            <p className="text-3xl font-bold text-gray-900">{score} <span className="text-lg text-gray-400">/ {maxScore}</span></p>
            <p className="text-sm text-gray-500 mt-1">
              {maxScore > 0 ? `${Math.round((score / maxScore) * 100)}%` : '—'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Your responses have been recorded. Results will be available after manual grading.</p>
        )}
        <p className="text-sm text-gray-400">You may now close this window.</p>
      </div>
    </div>
  );
}

// ─── Tab-switch warning ───────────────────────────────────────────────────────
function TabSwitchWarning({ count, onDismiss }) {
  if (!count) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-yellow-50 border border-yellow-300 rounded-lg px-5 py-3 shadow-md flex items-center gap-3 text-sm text-yellow-800">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
      <span>Tab switch detected ({count} time{count !== 1 ? 's' : ''}). This is being logged.</span>
      <button onClick={onDismiss} className="ml-2 text-yellow-600 hover:text-yellow-800 font-medium text-xs">Dismiss</button>
    </div>
  );
}

// ─── Main test-taking page ────────────────────────────────────────────────────
export default function TakeTest() {
  const { token } = useParams();

  const [state, setState]   = useState('loading'); // loading | error | start | taking | submitted
  const [errorType, setErrorType] = useState('');
  const [testData, setTestData]   = useState(null);
  const [attemptId, setAttemptId] = useState(null);
  const [responses, setResponses] = useState({});
  const [timeLeft, setTimeLeft]   = useState(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [showTabWarning, setShowTabWarning] = useState(false);
  const [submitResult, setSubmitResult] = useState(null);
  const [submitting, setSubmitting]     = useState(false);

  const timerRef    = useRef(null);
  const autoSaveRef = useRef(null);
  const attemptRef  = useRef(null);
  const responsesRef = useRef({});
  const timeLeftRef = useRef(null);

  responsesRef.current = responses;
  timeLeftRef.current  = timeLeft;

  // ── Load test ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/v1/test/${token}`)
      .then(r => r.json().then(d => ({ ok: r.ok, status: r.status, data: d })))
      .then(({ ok, status, data }) => {
        if (!ok) {
          const errType = data.error === 'REVOKED' ? 'REVOKED' :
                          data.error === 'COMPLETED' ? 'COMPLETED' :
                          data.error === 'EXPIRED'   ? 'EXPIRED' : 'NOT_FOUND';
          setErrorType(errType);
          setState('error');
          return;
        }
        setTestData(data);

        // If resuming an in-progress attempt
        if (data.attempt) {
          setAttemptId(data.attempt.id);
          attemptRef.current = data.attempt.id;
          if (data.test.timer_enabled && data.attempt.time_remaining_seconds !== null) {
            setTimeLeft(data.attempt.time_remaining_seconds);
          } else if (data.test.timer_enabled) {
            setTimeLeft(data.test.time_limit_minutes * 60);
          }
          // Restore saved responses
          const saved = {};
          for (const [qid, r] of Object.entries(data.saved_responses || {})) {
            saved[qid] = r;
          }
          setResponses(saved);
          setState('taking');
        } else {
          setState('start');
        }
      })
      .catch(() => { setErrorType('GENERIC'); setState('error'); });
  }, [token]);

  // ── Start attempt ──────────────────────────────────────────────────────────
  const startAttempt = async () => {
    const r = await fetch(`/api/v1/test/${token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start' }),
    });
    const d = await r.json();
    if (!r.ok) { setErrorType('GENERIC'); setState('error'); return; }
    setAttemptId(d.attempt_id);
    attemptRef.current = d.attempt_id;
    if (testData.test.timer_enabled) {
      setTimeLeft(testData.test.time_limit_minutes * 60);
    }
    setState('taking');
  };

  // ── Timer tick ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== 'taking' || !testData?.test?.timer_enabled) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(t => {
        if (t === null) return t;
        if (t <= 1) { clearInterval(timerRef.current); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [state, testData]);

  // ── Auto-save every 30s ────────────────────────────────────────────────────
  useEffect(() => {
    if (state !== 'taking') return;
    autoSaveRef.current = setInterval(async () => {
      if (!attemptRef.current) return;
      const responseArray = Object.entries(responsesRef.current).map(([question_id, r]) => ({
        question_id, ...r,
      }));
      await fetch(`/api/v1/test/${token}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attempt_id: attemptRef.current,
          responses: responseArray,
          time_remaining_seconds: timeLeftRef.current,
        }),
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [state, token]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submitTest = useCallback(async (autoSubmitted = false) => {
    if (submitting) return;
    setSubmitting(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    const responseArray = Object.entries(responsesRef.current).map(([question_id, r]) => ({
      question_id, ...r,
    }));
    try {
      const r = await fetch(`/api/v1/test/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit',
          attempt_id: attemptRef.current,
          responses: responseArray,
          time_remaining_seconds: timeLeftRef.current,
          auto_submitted: autoSubmitted,
        }),
      });
      const d = await r.json();
      setSubmitResult({ score: d.score, maxScore: d.max_score, autoSubmitted });
      setState('submitted');
    } finally {
      setSubmitting(false);
    }
  }, [submitting, token]);

  // ── Auto-submit on timer expiry ────────────────────────────────────────────
  const handleTimerExpire = useCallback(() => {
    if (state === 'taking') submitTest(true);
  }, [state, submitTest]);

  // ── Anti-cheat: tab switch / focus / visibility ────────────────────────────
  useEffect(() => {
    if (state !== 'taking') return;
    const copyPasteAllowed = testData?.test?.allow_copy_paste;

    const logIntegrity = (event_type) => {
      if (!attemptRef.current) return;
      fetch(`/api/v1/test/${token}/integrity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptRef.current, event_type }),
      }).catch(() => {});
    };

    const onVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches(n => n + 1);
        setShowTabWarning(true);
        logIntegrity('tab_switch');
        logIntegrity('visibility_change');
      } else {
        logIntegrity('focus_regained');
      }
    };

    const onBlur = () => logIntegrity('focus_lost');
    const onFocus = () => logIntegrity('focus_regained');

    const onCopy = (e) => {
      if (copyPasteAllowed) return;
      e.preventDefault();
      logIntegrity('copy_attempt');
    };
    const onPaste = (e) => {
      if (copyPasteAllowed) return;
      if (e.target?.tagName === 'TEXTAREA') return;
      e.preventDefault();
      logIntegrity('paste_attempt');
    };
    const onContextMenu = (e) => {
      if (copyPasteAllowed) return;
      e.preventDefault();
      logIntegrity('right_click');
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    document.addEventListener('copy', onCopy);
    document.addEventListener('paste', onPaste);
    document.addEventListener('contextmenu', onContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [state, token]);

  // ── User selection prevention (skipped when copy/paste is allowed) ────────
  useEffect(() => {
    if (state !== 'taking' || testData?.test?.allow_copy_paste) return;
    const style = document.createElement('style');
    style.id = 'anti-select';
    style.textContent = 'body { -webkit-user-select: none; user-select: none; } textarea { -webkit-user-select: text !important; user-select: text !important; }';
    document.head.appendChild(style);
    return () => document.getElementById('anti-select')?.remove();
  }, [state, testData]);

  const updateResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: { ...(prev[questionId] || {}), ...value } }));
  };

  const answeredCount = Object.keys(responses).filter(qid => {
    const r = responses[qid];
    return r.selected_option_id || r.text_response?.trim();
  }).length;

  // ── Render states ──────────────────────────────────────────────────────────
  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500">Loading test…</p>
        </div>
      </div>
    );
  }

  if (state === 'error') return <ErrorScreen type={errorType} />;

  if (state === 'submitted') {
    return <CompletionScreen score={submitResult?.score} maxScore={submitResult?.maxScore} autoSubmitted={submitResult?.autoSubmitted} />;
  }

  if (state === 'start') {
    const { test, link } = testData;
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-lg w-full space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            {link.recipient_name && (
              <p className="text-sm text-gray-500 mt-1">Hi <span className="font-medium text-gray-700">{link.recipient_name}</span></p>
            )}
          </div>

          {test.description && (
            <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 border border-gray-200 rounded-lg px-4 py-3">
              {test.description}
            </p>
          )}

          <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Questions</span>
              <span className="font-medium text-gray-800">{test.test_questions?.length || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Total points</span>
              <span className="font-medium text-gray-800">
                {(test.test_questions || []).reduce((s, q) => s + q.points, 0)}
              </span>
            </div>
            {test.timer_enabled && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Time limit</span>
                <span className="font-medium text-gray-800">{test.time_limit_minutes} minutes</span>
              </div>
            )}
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-800 space-y-1">
            <p className="font-semibold">Important</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Do not switch tabs or windows during the test.</li>
              {!test.allow_copy_paste && <li>Copy/paste and right-click are disabled.</li>}
              <li>Your progress is saved automatically every 30 seconds.</li>
              {test.timer_enabled && <li>The test will auto-submit when the time expires.</li>}
            </ul>
          </div>

          <button onClick={startAttempt}
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors">
            Start Test
          </button>
        </div>
      </div>
    );
  }

  // Taking state
  const { test } = testData;
  const questions = test.test_questions || [];
  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Anti-cheat warning */}
      {showTabWarning && (
        <TabSwitchWarning count={tabSwitches} onDismiss={() => setShowTabWarning(false)} />
      )}

      {/* Sticky header */}
      <div className="sticky top-0 bg-white border-b border-gray-200 z-40 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="font-semibold text-gray-900 truncate text-sm sm:text-base">{test.title}</h1>
            <span className="text-xs text-gray-400 flex-shrink-0">
              {answeredCount}/{totalQuestions} answered
            </span>
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
            {test.timer_enabled && timeLeft !== null && (
              <Timer secondsLeft={timeLeft} onExpire={handleTimerExpire} />
            )}
            <button
              onClick={() => {
                if (confirm('Submit your test now? You cannot make changes after submitting.')) {
                  submitTest(false);
                }
              }}
              disabled={submitting}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {submitting ? 'Submitting…' : 'Submit'}
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-0.5 bg-gray-100">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {questions.map((q, idx) => (
          <QuestionView
            key={q.id}
            question={q}
            index={idx}
            response={responses[q.id]}
            onChange={updateResponse}
          />
        ))}

        {/* Bottom submit */}
        <div className="pt-4 pb-8 text-center">
          <button
            onClick={() => {
              if (confirm('Submit your test? You cannot make changes after submitting.')) {
                submitTest(false);
              }
            }}
            disabled={submitting}
            className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 transition-colors">
            {submitting ? 'Submitting…' : `Submit Test (${answeredCount}/${totalQuestions} answered)`}
          </button>
        </div>
      </div>
    </div>
  );
}

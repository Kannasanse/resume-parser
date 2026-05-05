'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';

// ─── Timer ────────────────────────────────────────────────────────────────────
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

// ─── Full-screen tab-switch overlay (non-dismissable until user clicks) ───────
function TabSwitchOverlay({ count, threshold, action, thresholdHit, onContinue }) {
  const atThreshold = count >= threshold;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-7 space-y-5 text-center">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto ${
          atThreshold ? 'bg-red-100' : 'bg-yellow-100'
        }`}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none"
            stroke={atThreshold ? '#dc2626' : '#d97706'} strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        </div>

        <div className="space-y-2">
          <h2 className={`text-lg font-bold ${atThreshold ? 'text-red-700' : 'text-gray-900'}`}>
            {atThreshold && action === 'flag'
              ? 'Attempt Flagged'
              : 'Tab Switch Detected'}
          </h2>

          <p className="text-sm text-gray-600">
            You left the test window.{' '}
            <span className="font-semibold text-gray-800">
              This has been recorded ({count} time{count !== 1 ? 's' : ''}).
            </span>
          </p>

          {atThreshold && action === 'flag' && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700 text-left">
              <p className="font-semibold mb-0.5">Integrity threshold reached</p>
              <p>Your attempt has been flagged for review. You may continue the test, but this violation has been permanently recorded.</p>
            </div>
          )}

          {!atThreshold && (
            <p className="text-xs text-gray-400">
              {threshold - count} more tab switch{threshold - count !== 1 ? 'es' : ''} will trigger a {action === 'auto_submit' ? 'forced submission' : 'flag for review'}.
            </p>
          )}
        </div>

        <button
          onClick={onContinue}
          className={`w-full py-2.5 rounded-lg font-semibold text-sm transition-colors ${
            atThreshold && action === 'flag'
              ? 'bg-red-600 hover:bg-red-700 text-white'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}>
          I understand — Continue Test
        </button>
      </div>
    </div>
  );
}

// ─── Question renderer ────────────────────────────────────────────────────────
function QuestionView({ question, index, response, onChange, disableCopyPaste }) {
  const noSelectStyle = disableCopyPaste ? { userSelect: 'none', WebkitUserSelect: 'none' } : {};

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gray-100 text-gray-500 text-xs font-semibold flex items-center justify-center mt-0.5">
          {index + 1}
        </span>
        <div className="flex-1">
          <p
            className="text-gray-900 font-medium leading-relaxed"
            style={noSelectStyle}
            data-no-copy={disableCopyPaste ? 'true' : undefined}
          >
            {question.question_text}
          </p>
          <span className="text-xs text-gray-400 mt-0.5 inline-block">
            {question.points} pt{question.points !== 1 ? 's' : ''} ·{' '}
            {question.type === 'mcq' ? 'Multiple choice' : question.type === 'true_false' ? 'True / False' : 'Short answer'}
          </span>
        </div>
      </div>

      {(question.type === 'mcq' || question.type === 'true_false') && (
        <div className="pl-10 space-y-2">
          {question.test_options.map(opt => (
            <label key={opt.id}
              className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                response?.selected_option_id === opt.id
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
              }`}
              style={noSelectStyle}
              data-no-copy={disableCopyPaste ? 'true' : undefined}
            >
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
    REVOKED:   { title: 'Link Revoked',       body: 'This test link has been revoked. Please contact the person who sent it.' },
    COMPLETED: { title: 'Already Submitted',  body: 'You have already completed this test.' },
    EXPIRED:   { title: 'Link Expired',       body: 'This test link has expired. Please contact the sender for a new link.' },
    NOT_FOUND: { title: 'Not Found',          body: 'This test link is invalid or does not exist.' },
    GENERIC:   { title: 'Something Went Wrong', body: 'An unexpected error occurred. Please try again.' },
  };
  const { title, body } = messages[type] || messages.GENERIC;
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-md w-full text-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        </div>
        <h1 className="text-lg font-bold text-gray-900">{title}</h1>
        <p className="text-sm text-gray-500">{body}</p>
      </div>
    </div>
  );
}

// ─── Completion screen ────────────────────────────────────────────────────────
function CompletionScreen({ score, maxScore, autoSubmitted, autoSubmitReason }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-md w-full text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-green-50 flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <h1 className="text-xl font-bold text-gray-900">Test Submitted!</h1>
        {autoSubmitted && autoSubmitReason === 'timer' && (
          <p className="text-sm text-yellow-700 bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
            The test was automatically submitted when the time expired.
          </p>
        )}
        {autoSubmitted && autoSubmitReason === 'tab_switch' && (
          <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
            The test was automatically submitted due to repeated tab switching.
          </p>
        )}
        {score !== null && score !== undefined ? (
          <div className="bg-gray-50 border border-gray-200 rounded-lg px-6 py-4">
            <p className="text-3xl font-bold text-gray-900">
              {score} <span className="text-lg text-gray-400">/ {maxScore}</span>
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {maxScore > 0 ? `${Math.round((score / maxScore) * 100)}%` : '—'}
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Your responses have been recorded. Results will be available after manual grading.
          </p>
        )}
        <p className="text-sm text-gray-400">You may now close this window.</p>
      </div>
    </div>
  );
}

// ─── Main test-taking page ────────────────────────────────────────────────────
export default function TakeTest() {
  const { token } = useParams();

  const [state, setState]           = useState('loading');
  const [errorType, setErrorType]   = useState('');
  const [testData, setTestData]     = useState(null);
  const [attemptId, setAttemptId]   = useState(null);
  const [responses, setResponses]   = useState({});
  const [timeLeft, setTimeLeft]     = useState(null);
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showTabOverlay, setShowTabOverlay] = useState(false);
  const [thresholdHit, setThresholdHit]     = useState(false);
  const [submitResult, setSubmitResult]     = useState(null);
  const [submitting, setSubmitting]         = useState(false);

  const timerRef       = useRef(null);
  const autoSaveRef    = useRef(null);
  const attemptRef     = useRef(null);
  const responsesRef   = useRef({});
  const timeLeftRef    = useRef(null);
  const wasHiddenRef   = useRef(false);
  const tabCountRef    = useRef(0);
  const submittingRef  = useRef(false);

  responsesRef.current = responses;
  timeLeftRef.current  = timeLeft;
  submittingRef.current = submitting;

  // ── Load test ──────────────────────────────────────────────────────────────
  useEffect(() => {
    fetch(`/api/v1/test/${token}`)
      .then(r => r.json().then(d => ({ ok: r.ok, data: d })))
      .then(({ ok, data }) => {
        if (!ok) {
          const errType = ['REVOKED','COMPLETED','EXPIRED'].includes(data.error) ? data.error : 'NOT_FOUND';
          setErrorType(errType);
          setState('error');
          return;
        }
        setTestData(data);
        if (data.attempt) {
          setAttemptId(data.attempt.id);
          attemptRef.current = data.attempt.id;
          if (data.test.timer_enabled && data.attempt.time_remaining_seconds !== null) {
            setTimeLeft(data.attempt.time_remaining_seconds);
          } else if (data.test.timer_enabled) {
            setTimeLeft(data.test.time_limit_minutes * 60);
          }
          const saved = {};
          for (const [qid, r] of Object.entries(data.saved_responses || {})) saved[qid] = r;
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
    if (testData.test.timer_enabled) setTimeLeft(testData.test.time_limit_minutes * 60);
    setState('taking');
  };

  // ── Timer tick ─────────────────────────────────────────────────────────────
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
      const responseArray = Object.entries(responsesRef.current).map(([question_id, r]) => ({ question_id, ...r }));
      await fetch(`/api/v1/test/${token}/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attempt_id: attemptRef.current, responses: responseArray, time_remaining_seconds: timeLeftRef.current }),
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(autoSaveRef.current);
  }, [state, token]);

  // ── Submit ─────────────────────────────────────────────────────────────────
  const submitTest = useCallback(async (autoSubmitted = false, reason = 'manual') => {
    if (submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    clearInterval(timerRef.current);
    clearInterval(autoSaveRef.current);

    const responseArray = Object.entries(responsesRef.current).map(([question_id, r]) => ({ question_id, ...r }));
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
      setSubmitResult({ score: d.score, maxScore: d.max_score, autoSubmitted, autoSubmitReason: reason });
      setState('submitted');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [token]);

  const handleTimerExpire = useCallback(() => {
    if (state === 'taking') submitTest(true, 'timer');
  }, [state, submitTest]);

  // ── Integrity logger ───────────────────────────────────────────────────────
  const logIntegrity = useCallback((event_type) => {
    if (!attemptRef.current) return;
    fetch(`/api/v1/test/${token}/integrity`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attempt_id: attemptRef.current, event_type }),
    }).catch(() => {});
  }, [token]);

  // ── Anti-cheat: tab-switch monitoring ─────────────────────────────────────
  useEffect(() => {
    if (state !== 'taking') return;
    const test = testData?.test;
    if (!test?.tab_switch_monitoring) return;

    const threshold = test.tab_switch_threshold || 3;
    const action    = test.tab_switch_action || 'flag';

    const onVisibilityChange = () => {
      if (document.hidden) {
        wasHiddenRef.current = true;
        logIntegrity('tab_switch');
      } else if (wasHiddenRef.current) {
        wasHiddenRef.current = false;
        tabCountRef.current += 1;
        const count = tabCountRef.current;
        setTabSwitchCount(count);

        if (count >= threshold) {
          if (action === 'auto_submit') {
            logIntegrity('threshold_reached');
            submitTest(true, 'tab_switch');
            return;
          } else {
            logIntegrity('threshold_reached');
            setThresholdHit(true);
          }
        }

        setShowTabOverlay(true);
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);
    return () => document.removeEventListener('visibilitychange', onVisibilityChange);
  }, [state, testData, logIntegrity, submitTest]);

  // ── Anti-cheat: copy-paste enforcement ────────────────────────────────────
  useEffect(() => {
    if (state !== 'taking') return;
    const test = testData?.test;
    if (!test?.disable_copy_paste) return;

    // Block paste everywhere (including textareas)
    const onPaste = (e) => {
      e.preventDefault();
      logIntegrity('paste_attempt');
    };

    // Block copy only on question/option text (elements with data-no-copy)
    const onCopy = (e) => {
      if (e.target?.closest?.('[data-no-copy]')) {
        e.preventDefault();
        logIntegrity('copy_attempt');
      }
    };

    // Block right-click everywhere
    const onContextMenu = (e) => {
      e.preventDefault();
      logIntegrity('right_click');
    };

    document.addEventListener('paste', onPaste);
    document.addEventListener('copy', onCopy);
    document.addEventListener('contextmenu', onContextMenu);
    return () => {
      document.removeEventListener('paste', onPaste);
      document.removeEventListener('copy', onCopy);
      document.removeEventListener('contextmenu', onContextMenu);
    };
  }, [state, testData, logIntegrity]);

  const updateResponse = (questionId, value) => {
    setResponses(prev => ({ ...prev, [questionId]: { ...(prev[questionId] || {}), ...value } }));
  };

  const answeredCount = Object.keys(responses).filter(qid => {
    const r = responses[qid];
    return r.selected_option_id || r.text_response?.trim();
  }).length;

  // ── Render: loading ────────────────────────────────────────────────────────
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
    return (
      <CompletionScreen
        score={submitResult?.score}
        maxScore={submitResult?.maxScore}
        autoSubmitted={submitResult?.autoSubmitted}
        autoSubmitReason={submitResult?.autoSubmitReason}
      />
    );
  }

  // ── Render: start screen ───────────────────────────────────────────────────
  if (state === 'start') {
    const { test, link } = testData;
    const disableCopyPaste   = test.disable_copy_paste;
    const tabMonitoring      = test.tab_switch_monitoring;
    const tabThreshold       = test.tab_switch_threshold || 3;
    const tabAction          = test.tab_switch_action || 'flag';

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 max-w-lg w-full space-y-5">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{test.title}</h1>
            {link.recipient_name && (
              <p className="text-sm text-gray-500 mt-1">
                Hi <span className="font-medium text-gray-700">{link.recipient_name}</span>
              </p>
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
            <p className="font-semibold">Important — Please Read</p>
            <ul className="list-disc list-inside space-y-0.5 text-amber-700">
              <li>Your progress is saved automatically every 30 seconds.</li>
              {test.timer_enabled && <li>The test will auto-submit when the time expires.</li>}
              {disableCopyPaste && (
                <li>
                  Copy-paste is disabled. Pasting into answers is blocked. Question text cannot be copied.
                  Right-click is disabled.
                </li>
              )}
              {tabMonitoring && (
                <li>
                  Leaving this window or switching tabs is monitored.
                  After {tabThreshold} violation{tabThreshold !== 1 ? 's' : ''},
                  your attempt will be {tabAction === 'auto_submit' ? 'automatically submitted' : 'flagged for review'}.
                </li>
              )}
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

  // ── Render: taking ─────────────────────────────────────────────────────────
  const { test } = testData;
  const questions = test.test_questions || [];
  const totalQuestions = questions.length;
  const disableCopyPaste = test.disable_copy_paste;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full-screen tab-switch overlay */}
      {showTabOverlay && (
        <TabSwitchOverlay
          count={tabSwitchCount}
          threshold={test.tab_switch_threshold || 3}
          action={test.tab_switch_action || 'flag'}
          thresholdHit={thresholdHit}
          onContinue={() => setShowTabOverlay(false)}
        />
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
            disableCopyPaste={disableCopyPaste}
          />
        ))}

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

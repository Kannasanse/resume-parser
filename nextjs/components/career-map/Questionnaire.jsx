'use client';
import { useState, useCallback } from 'react';
import QuestionCard from './QuestionCard';
import QuestionLoadingState from './QuestionLoadingState';
import QuestionnaireComplete from './QuestionnaireComplete';

// State machine: loading | question | complete | error
export default function Questionnaire({ profile, sessionId, onSubmit, loading: profileLoading }) {
  const [uiState, setUiState]         = useState('idle'); // idle | loading | question | complete | error
  const [questions, setQuestions]     = useState([]);     // [{question, confidenceAfter, shouldContinue}]
  const [answers, setAnswers]         = useState([]);     // [{questionNumber, answerValue, answerLabel}]
  const [currentIdx, setCurrentIdx]   = useState(0);     // index into questions array
  const [currentAnswer, setCurrentAnswer] = useState({ value: '', label: '' });
  const [errorMsg, setErrorMsg]       = useState('');
  const [completing, setCompleting]   = useState(false);

  // Fetch question N from API
  const fetchQuestion = useCallback(async (questionNumber, prevAnswers) => {
    setUiState('loading');
    setErrorMsg('');
    try {
      const r = await fetch('/api/v1/career-map/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          extractedProfile: profile,
          previousQuestions: prevAnswers.map(a => ({
            questionNumber: a.questionNumber,
            questionText:   a.questionText,
            questionIntent: a.questionIntent,
            answerValue:    a.answerValue,
            answerLabel:    a.answerLabel,
          })),
          questionNumber,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to generate question');

      setQuestions(prev => {
        const updated = [...prev];
        updated[questionNumber - 1] = d;
        return updated;
      });
      setCurrentIdx(questionNumber - 1);
      setCurrentAnswer({ value: '', label: '' });
      setUiState('question');
    } catch (err) {
      setErrorMsg(err.message);
      setUiState('error');
    }
  }, [sessionId, profile]);

  // Start: fetch Q1 when profile is ready
  const start = useCallback(() => {
    if (uiState === 'idle' && profile && sessionId) {
      fetchQuestion(1, []);
    }
  }, [uiState, profile, sessionId, fetchQuestion]);

  // Kick off when profile arrives (first render after profileLoading ends)
  if (!profileLoading && profile && sessionId && uiState === 'idle') {
    start();
  }

  // Submit current answer and decide next step
  async function handleNext() {
    const current = questions[currentIdx];
    if (!current) return;

    const questionNumber = current.question.questionNumber;
    const { value, label } = currentAnswer;

    // Save answer record
    const newAnswer = {
      questionNumber,
      questionText:   current.question.questionText,
      questionIntent: current.question.questionIntent,
      answerValue:    value,
      answerLabel:    label,
    };

    const updatedAnswers = answers.filter(a => a.questionNumber !== questionNumber).concat(newAnswer);
    setAnswers(updatedAnswers);

    // Persist to API (fire-and-forget, non-blocking)
    fetch('/api/v1/career-map/submit-answer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId,
        questionNumber,
        answerValue:    value,
        answerLabel:    label,
        confidenceAfter: current.confidenceAfter,
        shouldContinue:  current.shouldContinue,
      }),
    }).catch(() => {});

    if (!current.shouldContinue) {
      // Done — show completion card then call onSubmit
      setCompleting(true);
      setUiState('complete');
    } else {
      // Check if we already fetched this question (back navigation)
      const nextNum = questionNumber + 1;
      if (questions[nextNum - 1]) {
        setCurrentIdx(nextNum - 1);
        // Pre-fill previous answer if going back and re-advancing
        const existingAns = updatedAnswers.find(a => a.questionNumber === nextNum);
        setCurrentAnswer({ value: existingAns?.answerValue || '', label: existingAns?.answerLabel || '' });
        setUiState('question');
      } else {
        fetchQuestion(nextNum, updatedAnswers);
      }
    }
  }

  function handleSkip() {
    const current = questions[currentIdx];
    if (!current) return;
    setCurrentAnswer({ value: '', label: '(skipped)' });
    // Treat skip as empty answer — let handleNext proceed
    setTimeout(() => handleNext(), 0);
  }

  function handleBack() {
    if (currentIdx <= 0) return;
    const prevIdx = currentIdx - 1;
    setCurrentIdx(prevIdx);
    const prev = questions[prevIdx];
    const existingAns = answers.find(a => a.questionNumber === (prevIdx + 1));
    setCurrentAnswer({ value: existingAns?.answerValue || '', label: existingAns?.answerLabel || '' });
    setUiState('question');
  }

  function handleContinue() {
    // Called by QuestionnaireComplete after animation
    onSubmit(answers);
  }

  // ── Profile loading state ──────────────────────────────────────────────────
  if (profileLoading || uiState === 'idle') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-10 text-center space-y-5">
          <div className="stat-icon mx-auto">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V9"/><path d="M9 3l6 6h6"/>
            </svg>
          </div>
          <div>
            <p className="text-base font-semibold text-[var(--c-text)]">Analysing your resume…</p>
            <p className="text-sm text-[var(--c-text-muted)] mt-1">This takes a few seconds</p>
          </div>
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--c-primary)] rounded-full animate-pulse w-3/4" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────
  if (uiState === 'error') {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card p-8 text-center space-y-4">
          <p className="text-sm font-medium text-red-600">{errorMsg || 'Something went wrong generating your question.'}</p>
          <button
            onClick={() => fetchQuestion(questions.length + 1, answers)}
            className="text-sm text-[var(--c-primary)] hover:underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  // ── Completion state ───────────────────────────────────────────────────────
  if (uiState === 'complete') {
    const lastQ = questions[questions.length - 1];
    return (
      <div className="max-w-2xl mx-auto">
        <QuestionnaireComplete
          questionCount={answers.filter(a => a.answerValue).length}
          confidenceScore={lastQ?.confidenceAfter || 0}
          onContinue={handleContinue}
        />
      </div>
    );
  }

  // ── Loading next question ──────────────────────────────────────────────────
  if (uiState === 'loading') {
    const nextNum = (questions.length || 0) + 1;
    return (
      <div className="max-w-2xl mx-auto">
        <div className="card shadow-2xl p-8">
          <QuestionLoadingState questionNumber={nextNum} />
        </div>
      </div>
    );
  }

  // ── Active question ────────────────────────────────────────────────────────
  const current = questions[currentIdx];
  if (!current) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <QuestionCard
        question={current.question}
        questionNumber={current.question.questionNumber}
        answerValue={currentAnswer.value}
        onAnswer={(value, label) => setCurrentAnswer({ value, label })}
        onSkip={handleSkip}
        onBack={handleBack}
        onNext={handleNext}
        confidence={current.confidenceAfter}
        isLast={!current.shouldContinue}
      />
    </div>
  );
}

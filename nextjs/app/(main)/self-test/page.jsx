'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const DIFF_COLORS = {
  easy:   'border-green-400 bg-green-50 text-green-700',
  medium: 'border-amber-400 bg-amber-50 text-amber-700',
  hard:   'border-red-400 bg-red-50 text-red-700',
};

// ─── Skill tag input ──────────────────────────────────────────────────────────
function SkillTagInput({ skills, onChange, suggestions }) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  const filtered = input.trim().length > 0
    ? suggestions.filter(s => s.toLowerCase().includes(input.toLowerCase()) && !skills.includes(s))
    : [];

  const addSkill = (s) => {
    const trimmed = s.trim();
    if (!trimmed || skills.includes(trimmed)) return;
    onChange([...skills, trimmed]);
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const removeSkill = (s) => onChange(skills.filter(x => x !== s));

  const handleKeyDown = (e) => {
    if ((e.key === 'Enter' || e.key === ',') && input.trim()) {
      e.preventDefault();
      addSkill(input);
    }
    if (e.key === 'Backspace' && !input && skills.length) {
      onChange(skills.slice(0, -1));
    }
  };

  return (
    <div className="relative">
      <div
        className="min-h-[42px] w-full px-2 py-1.5 border border-ds-inputBorder rounded bg-ds-bg flex flex-wrap gap-1.5 items-center cursor-text focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-colors"
        onClick={() => inputRef.current?.focus()}
      >
        {skills.map(s => (
          <span key={s} className="flex items-center gap-1 text-xs bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-full font-medium">
            {s}
            <button type="button" onClick={() => removeSkill(s)} className="text-primary/60 hover:text-primary leading-none text-sm">×</button>
          </span>
        ))}
        <input
          ref={inputRef}
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true); }}
          onKeyDown={handleKeyDown}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          placeholder={skills.length ? '' : 'Type a skill and press Enter…'}
          className="flex-1 min-w-24 text-sm bg-transparent outline-none text-ds-text placeholder-ds-textMuted py-0.5"
        />
      </div>
      {showSuggestions && filtered.length > 0 && (
        <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-ds-card border border-ds-border rounded shadow-lg max-h-44 overflow-y-auto py-1">
          {filtered.slice(0, 10).map(s => (
            <button key={s} type="button" onMouseDown={() => addSkill(s)}
              className="w-full text-left px-3 py-1.5 text-sm text-ds-text hover:bg-ds-bg transition-colors">
              {s}
            </button>
          ))}
        </div>
      )}
      {skills.length > 0 && (
        <p className="text-xs text-ds-textMuted mt-1">{skills.length} skill{skills.length !== 1 ? 's' : ''} selected</p>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SelfTestCreate() {
  const router = useRouter();
  const [step, setStep]         = useState('form'); // form | generating | review
  const [inputMode, setInputMode] = useState('skills');
  const [skills, setSkills]     = useState([]);
  const [content, setContent]   = useState('');
  const [difficulty, setDifficulty] = useState(null);
  const [timer, setTimer]       = useState(30);
  const [timerError, setTimerError] = useState('');
  const [error, setError]       = useState('');
  const [session, setSession]   = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  useEffect(() => {
    fetch('/api/v1/self-test/skills')
      .then(r => r.json())
      .then(d => setSuggestions(d.skills || []))
      .catch(() => {});
  }, []);

  const estimatedCount = inputMode === 'skills'
    ? Math.min(Math.max(skills.length * 5, 5), 20)
    : Math.min(Math.max(Math.floor(content.length / 100) * 2, 5), 10);

  const validateTimer = (val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 5 || n > 180) {
      setTimerError('Please enter a valid duration between 5 and 180 minutes.');
      return false;
    }
    setTimerError('');
    return true;
  };

  const canGenerate = (() => {
    if (!difficulty) return false;
    if (timerError) return false;
    if (inputMode === 'skills') return skills.length > 0;
    return content.trim().length >= 100;
  })();

  const generate = async () => {
    setError('');
    if (!validateTimer(timer)) return;

    const input_data = inputMode === 'skills' ? skills.join(', ') : content;

    setStep('generating');
    try {
      const r = await fetch('/api/v1/self-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input_type: inputMode, input_data, difficulty, timer_minutes: timer }),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || 'We were unable to generate questions at this time. Please try again.');
        setStep('form');
        return;
      }
      setSession(d.session);
      setStep('review');
    } catch {
      setError('We were unable to generate questions at this time. Please try again.');
      setStep('form');
    }
  };

  const startTest = () => {
    router.push(`/self-test/${session.id}`);
  };

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ds-text font-heading">Create Self-Test</h1>
        <p className="text-sm text-ds-textMuted mt-0.5">Generate a personalised practice test in seconds.</p>
      </div>

      {/* Form step */}
      {step === 'form' && (
        <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-5">
          {error && (
            <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2.5 flex items-start justify-between gap-3">
              <span>{error}</span>
              <button onClick={generate} className="text-xs font-semibold underline flex-shrink-0">Retry</button>
            </div>
          )}

          {/* Input mode */}
          <div>
            <label className="block text-sm font-medium text-ds-text mb-2">Content Source</label>
            <div className="grid grid-cols-2 gap-2">
              {[['skills', 'Choose Skills'], ['content', 'Enter My Content']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setInputMode(v)}
                  className={`py-2.5 text-sm rounded border transition-colors font-medium ${inputMode === v ? 'border-primary bg-primary/10 text-primary' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Skill input */}
          {inputMode === 'skills' ? (
            <div>
              <label className="block text-sm font-medium text-ds-text mb-1.5">
                Skills <span className="text-ds-danger">*</span>
              </label>
              <SkillTagInput skills={skills} onChange={setSkills} suggestions={suggestions} />
              {skills.length === 0 && (
                <p className="text-xs text-ds-textMuted mt-1">Select skills from suggestions or type your own</p>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-ds-text mb-1.5">
                Content <span className="text-ds-danger">*</span>
              </label>
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                rows={7}
                placeholder="Paste notes, documentation, or study material here…"
                maxLength={10000}
                className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted resize-none"
              />
              <div className="flex items-center justify-between mt-1">
                <span className={`text-xs ${content.length < 100 ? 'text-ds-danger' : 'text-ds-textMuted'}`}>
                  {content.length < 100 ? `${content.length}/100 minimum characters` : `${content.length}/10,000`}
                </span>
                {content.length < 100 && content.length > 0 && (
                  <span className="text-xs text-ds-danger">Your content is too short to generate a test. Please add more detail (minimum 100 characters).</span>
                )}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            {/* Difficulty */}
            <div>
              <label className="block text-sm font-medium text-ds-text mb-1.5">
                Difficulty <span className="text-ds-danger">*</span>
              </label>
              <div className="space-y-1.5">
                {[['easy', 'Easy'], ['medium', 'Medium'], ['hard', 'Hard']].map(([v, l]) => (
                  <button key={v} type="button" onClick={() => setDifficulty(v)}
                    className={`w-full py-1.5 text-sm rounded border transition-colors font-medium ${difficulty === v ? DIFF_COLORS[v] : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Timer */}
            <div>
              <label className="block text-sm font-medium text-ds-text mb-1.5">Timer (minutes)</label>
              <input
                type="number" min="5" max="180"
                value={timer}
                onChange={e => { setTimer(e.target.value); validateTimer(e.target.value); }}
                className={`w-full px-3 py-2 text-sm border rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary ${timerError ? 'border-ds-danger' : 'border-ds-inputBorder'}`}
              />
              {timerError
                ? <p className="text-xs text-ds-danger mt-1">{timerError}</p>
                : <p className="text-xs text-ds-textMuted mt-1">5–180 minutes</p>
              }

              {/* Estimated question count */}
              <div className="mt-4 p-3 bg-ds-bg border border-ds-border rounded-lg text-center">
                <p className="text-2xl font-bold text-ds-text font-heading">~{estimatedCount}</p>
                <p className="text-xs text-ds-textMuted mt-0.5">estimated questions</p>
                {inputMode === 'skills' && skills.length > 0 && (
                  <p className="text-xs text-ds-textMuted">~5 per skill</p>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={generate}
            disabled={!canGenerate}
            className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            Generate Test →
          </button>
          {!difficulty && (
            <p className="text-xs text-ds-textMuted text-center -mt-3">Select a difficulty to enable generation</p>
          )}
        </div>
      )}

      {/* Generating step */}
      {step === 'generating' && (
        <div className="bg-ds-card border border-ds-border rounded-lg p-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-ds-text">Generating your test questions…</p>
          <p className="text-xs text-ds-textMuted">This usually takes 10–20 seconds</p>
        </div>
      )}

      {/* Review step */}
      {step === 'review' && session && (
        <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>
            <h2 className="text-lg font-bold text-ds-text font-heading">Test Ready!</h2>
            <p className="text-sm text-ds-textMuted">Your questions have been generated and are ready to go.</p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-ds-bg border border-ds-border rounded-lg p-3">
              <p className="text-2xl font-bold text-ds-text font-heading">{session.question_count}</p>
              <p className="text-xs text-ds-textMuted mt-0.5">Questions</p>
            </div>
            <div className="bg-ds-bg border border-ds-border rounded-lg p-3">
              <p className={`text-sm font-bold capitalize ${
                session.difficulty === 'easy' ? 'text-green-700'
                : session.difficulty === 'medium' ? 'text-amber-700'
                : 'text-red-700'
              }`}>{session.difficulty}</p>
              <p className="text-xs text-ds-textMuted mt-0.5">Difficulty</p>
            </div>
            <div className="bg-ds-bg border border-ds-border rounded-lg p-3">
              <p className="text-2xl font-bold text-ds-text font-heading">{session.timer_minutes}</p>
              <p className="text-xs text-ds-textMuted mt-0.5">Minutes</p>
            </div>
          </div>

          <p className="text-xs text-ds-textMuted text-center">
            The timer starts the moment you begin. Navigate freely between questions before submitting.
          </p>

          <div className="flex gap-3">
            <button onClick={startTest}
              className="flex-1 bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark transition-colors">
              Start Test →
            </button>
            <button onClick={() => { setStep('form'); setSession(null); setError(''); }}
              className="px-4 py-2.5 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
              ← Regenerate
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

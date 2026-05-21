'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const DIFF_COLORS = {
  easy:   'border-green-400 bg-green-50 text-green-700',
  medium: 'border-amber-400 bg-amber-50 text-amber-700',
  hard:   'border-red-400 bg-red-50 text-red-700',
};

const CONF_STYLES = {
  High:   'bg-green-100 text-green-700 border-green-300',
  Medium: 'bg-amber-50 text-amber-700 border-amber-200',
  Low:    'bg-gray-100 text-gray-500 border-gray-300',
};

// ─── Icons ────────────────────────────────────────────────────────────────────
function SkillsIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.22 4.22l2.12 2.12M17.66 17.66l2.12 2.12M2 12h3M19 12h3M4.22 19.78l2.12-2.12M17.66 6.34l2.12-2.12"/>
    </svg>
  );
}

function ContentIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>
    </svg>
  );
}

function JdIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/>
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}

function ArrowLeft() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>
    </svg>
  );
}

// ─── Skill tag input (existing skills/content mode) ───────────────────────────
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
          <span key={s} className="chip-primary flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium">
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

// ─── JD skill chip ────────────────────────────────────────────────────────────
function JdChip({ skill, onRemove }) {
  const conf = skill.confidence;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs border px-2.5 py-1 rounded-full font-medium ${CONF_STYLES[conf]}`}>
      {conf === 'Low' && <span title="Low confidence — may not be a core requirement">⚠️</span>}
      {skill.name}
      <span className={`text-[10px] font-normal opacity-70`}>{conf}</span>
      <button
        type="button"
        onClick={() => onRemove(skill.name)}
        className="ml-0.5 opacity-60 hover:opacity-100 leading-none"
        aria-label={`Remove ${skill.name}`}
      >
        ×
      </button>
    </span>
  );
}

// ─── Question type selector ───────────────────────────────────────────────────
function QuestionTypeSelector({ questionType, setQuestionType }) {
  return (
    <div>
      <label className="block text-sm font-medium text-ds-text mb-1.5">Question Types</label>
      <div className="grid grid-cols-3 gap-2">
        {[['mcq', 'MCQ Only'], ['short_answer', 'Short Answer'], ['mixed', 'Mixed']].map(([v, l]) => (
          <button key={v} type="button" onClick={() => setQuestionType(v)}
            className={`py-2 text-xs rounded border font-medium transition-colors ${
              questionType === v
                ? 'border-[var(--c-primary)] bg-primary/10 text-[var(--c-primary)]'
                : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'
            }`}>
            {l}
          </button>
        ))}
      </div>
      {questionType === 'mixed' && (
        <p className="text-xs text-ds-textMuted mt-1.5">~70% MCQ / ~30% Short Answer · AI graded</p>
      )}
      {questionType === 'short_answer' && (
        <p className="text-xs text-ds-textMuted mt-1.5">Written responses — graded automatically by AI</p>
      )}
    </div>
  );
}

// ─── Difficulty + Timer sub-form (shared by form step and jd-skills step) ────
function DifficultyTimer({ difficulty, setDifficulty, timer, setTimer, timerError, validateTimer, estimatedCount, mode }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        <div className="mt-4 p-3 bg-ds-bg border border-ds-border rounded-lg text-center">
          <p className="text-2xl font-bold text-ds-text font-heading">~{estimatedCount}</p>
          <p className="text-xs text-ds-textMuted mt-0.5">estimated questions</p>
          {mode === 'jd' && <p className="text-xs text-ds-textMuted">~3 per skill</p>}
          {mode === 'skills' && <p className="text-xs text-ds-textMuted">~5 per skill</p>}
        </div>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function SelfTestCreate() {
  const router = useRouter();

  // Step: mode-select | form | jd-input | jd-skills | generating | review
  const [step, setStep]       = useState('mode-select');
  const [mode, setMode]       = useState(null); // 'skills' | 'content' | 'jd'

  // Skills/content form state
  const [skills, setSkills]   = useState([]);
  const [content, setContent] = useState('');

  // Question type configuration
  const [questionType, setQuestionType] = useState('mcq'); // 'mcq' | 'short_answer' | 'mixed'

  // Shared
  const [difficulty, setDifficulty] = useState(null);
  const [timer, setTimer]           = useState(30);
  const [timerError, setTimerError] = useState('');
  const [error, setError]           = useState('');
  const [session, setSession]       = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // JD state
  const [jdText, setJdText]         = useState('');
  const [jdSkills, setJdSkills]     = useState([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState('');
  const [undoSkill, setUndoSkill]   = useState(null);
  const [jdPreviewOpen, setJdPreviewOpen] = useState(false);
  const [addSkillInput, setAddSkillInput] = useState('');
  const [showAddSuggestions, setShowAddSuggestions] = useState(false);
  const undoTimerRef = useRef(null);
  const addSkillRef  = useRef(null);

  useEffect(() => {
    fetch('/api/v1/self-test/skills')
      .then(r => r.json())
      .then(d => setSuggestions(d.skills || []))
      .catch(() => {});

    // Retake: pre-populate JD skills from sessionStorage
    try {
      const retake = sessionStorage.getItem('jd_retake');
      if (retake) {
        sessionStorage.removeItem('jd_retake');
        const { skills: retakeSkills, jdText: retakeText } = JSON.parse(retake);
        if (Array.isArray(retakeSkills) && retakeSkills.length) {
          setJdSkills(retakeSkills);
          setJdText(retakeText || '');
          setMode('jd');
          setStep('jd-skills');
        }
      }
    } catch {}
  }, []);

  const validateTimer = (val) => {
    const n = parseInt(val);
    if (isNaN(n) || n < 5 || n > 180) {
      setTimerError('Please enter a valid duration between 5 and 180 minutes.');
      return false;
    }
    setTimerError('');
    return true;
  };

  const estimatedCount = mode === 'skills'
    ? Math.min(Math.max(skills.length * 5, 5), 20)
    : mode === 'jd'
    ? Math.min(Math.max(jdSkills.length * 3, 5), 20)
    : Math.min(Math.max(Math.floor(content.length / 100) * 2, 5), 10);

  const canGenerate = (() => {
    if (!difficulty || timerError) return false;
    if (mode === 'skills')  return skills.length > 0;
    if (mode === 'content') return content.trim().length >= 100;
    if (mode === 'jd')      return jdSkills.length >= 1;
    return false;
  })();

  // ── Mode selection ──────────────────────────────────────────────────────────
  const selectMode = (m) => {
    setMode(m);
    setError('');
    setDifficulty(null);
    if (m === 'jd') setStep('jd-input');
    else setStep('form');
  };

  // ── JD extraction ───────────────────────────────────────────────────────────
  const extractSkills = async () => {
    setExtractError('');
    setExtracting(true);
    try {
      const r = await fetch('/api/v1/self-test/jd-extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jd_text: jdText }),
      });
      const d = await r.json();
      if (!r.ok) {
        setExtractError(d.error || 'Failed to extract skills. Please try again.');
        return;
      }
      setJdSkills(d.skills || []);
      setStep('jd-skills');
    } catch {
      setExtractError('Network error. Please try again.');
    } finally {
      setExtracting(false);
    }
  };

  // ── JD skill management ─────────────────────────────────────────────────────
  const removeJdSkill = (name) => {
    const removed = jdSkills.find(s => s.name === name);
    setJdSkills(prev => prev.filter(s => s.name !== name));
    clearTimeout(undoTimerRef.current);
    setUndoSkill(removed);
    undoTimerRef.current = setTimeout(() => setUndoSkill(null), 5000);
  };

  const undoRemove = () => {
    if (!undoSkill) return;
    setJdSkills(prev => [...prev, undoSkill]);
    setUndoSkill(null);
    clearTimeout(undoTimerRef.current);
  };

  const addJdSkillManual = (name) => {
    const trimmed = name.trim();
    if (!trimmed || jdSkills.find(s => s.name.toLowerCase() === trimmed.toLowerCase()) || jdSkills.length >= 20) return;
    setJdSkills(prev => [...prev, { name: trimmed, type: 'Hard', confidence: 'Medium' }]);
    setAddSkillInput('');
    setShowAddSuggestions(false);
    addSkillRef.current?.focus();
  };

  const filteredAddSuggestions = addSkillInput.trim().length >= 3
    ? suggestions.filter(s => s.toLowerCase().includes(addSkillInput.toLowerCase()) && !jdSkills.find(j => j.name === s))
    : [];

  // ── Generate ────────────────────────────────────────────────────────────────
  const generate = async () => {
    setError('');
    if (!validateTimer(timer)) return;

    const qtypes = questionType === 'mixed' ? ['mcq', 'short_answer'] : [questionType];
    const qConfig = { question_types: qtypes };

    let body;
    if (mode === 'skills') {
      body = { input_type: 'skills', input_data: skills.join(', '), difficulty, timer_minutes: timer, ...qConfig };
    } else if (mode === 'content') {
      body = { input_type: 'content', input_data: content, difficulty, timer_minutes: timer, ...qConfig };
    } else {
      body = { input_type: 'jd', input_data: jdText, jd_skills: jdSkills, difficulty, timer_minutes: timer, ...qConfig };
    }

    setStep('generating');
    try {
      const r = await fetch('/api/v1/self-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) {
        setError(d.error || 'We were unable to generate questions at this time. Please try again.');
        setStep(mode === 'jd' ? 'jd-skills' : 'form');
        return;
      }
      setSession(d.session);
      setStep('review');
    } catch {
      setError('We were unable to generate questions at this time. Please try again.');
      setStep(mode === 'jd' ? 'jd-skills' : 'form');
    }
  };

  const startTest = () => router.push(`/self-test/${session.id}`);

  const reset = () => {
    setStep('mode-select');
    setMode(null);
    setSession(null);
    setError('');
    setDifficulty(null);
  };

  // ── Page header ─────────────────────────────────────────────────────────────
  const STEP_TITLES = {
    'mode-select': 'Interview Prep',
    'form':        mode === 'skills' ? 'Assess by Skill' : 'Assess by Content',
    'jd-input':   'Assess by Job Description',
    'jd-skills':  'Review Extracted Skills',
    'generating': 'Generating Test…',
    'review':     null,
  };

  const STEP_BACKS = {
    'form':       () => setStep('mode-select'),
    'jd-input':  () => setStep('mode-select'),
    'jd-skills': () => setStep('jd-input'),
  };

  const lowConfCount = jdSkills.filter(s => s.confidence === 'Low').length;
  const hardSkills   = jdSkills.filter(s => s.type === 'Hard');
  const softSkills   = jdSkills.filter(s => s.type === 'Soft');

  return (
    <div className="gradient-mesh-1 min-h-screen px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Header */}
      <div>
        {STEP_BACKS[step] && (
          <button
            onClick={STEP_BACKS[step]}
            className="inline-flex items-center gap-1.5 text-xs text-ds-textMuted hover:text-ds-text transition-colors mb-3"
          >
            <ArrowLeft /> Back
          </button>
        )}
        {STEP_TITLES[step] && (
          <>
            <h1 className="text-[26px] font-extrabold tracking-tight font-heading text-gradient-primary">{STEP_TITLES[step]}</h1>
            {step === 'mode-select' && (
              <p className="text-sm text-ds-textMuted mt-0.5">Choose a source and we'll generate a personalised practice test.</p>
            )}
            {step === 'jd-input' && (
              <p className="text-sm text-ds-textMuted mt-0.5">Paste a job description and we'll extract the key skills to assess you on.</p>
            )}
            {step === 'jd-skills' && (
              <p className="text-sm text-ds-textMuted mt-0.5">
                {jdSkills.length} skill{jdSkills.length !== 1 ? 's' : ''} extracted — remove irrelevant ones or add your own.
              </p>
            )}
          </>
        )}
      </div>

      {/* ── Step: Mode selection ─────────────────────────────────────────────── */}
      {step === 'mode-select' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          {[
            {
              id: 'skills',
              icon: <SkillsIcon />,
              title: 'Assess by Skill',
              desc: 'Select specific skills and get questions testing your knowledge of each.',
            },
            {
              id: 'content',
              icon: <ContentIcon />,
              title: 'Assess by Content',
              desc: 'Paste your notes or study material and generate questions from it.',
            },
            {
              id: 'jd',
              icon: <JdIcon />,
              title: 'Assess by Job Description',
              desc: 'Paste a job posting — we extract the skills and test your fit.',
            },
          ].map(card => (
            <button
              key={card.id}
              type="button"
              onClick={() => selectMode(card.id)}
              className={`card card-interactive mode-card text-left ${mode === card.id ? 'card-featured' : ''}`}
            >
              <span className={`stat-icon mb-3 ${mode === card.id ? '' : ''}`}>
                {card.icon}
              </span>
              <p className={`font-semibold text-sm mb-1 ${mode === card.id ? 'text-[var(--c-primary)]' : 'text-[var(--c-text)]'}`}>{card.title}</p>
              <p className="text-xs text-[var(--c-text-2)] leading-relaxed">{card.desc}</p>
              <p className="text-xs text-[var(--c-primary)] font-medium mt-3">Start →</p>
            </button>
          ))}
        </div>
      )}

      {/* ── Step: Skills / Content form ──────────────────────────────────────── */}
      {step === 'form' && (
        <div className="w-full max-w-4xl mx-auto">
        <div className="card shadow-2xl p-6 space-y-5">
          {error && (
            <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2.5 flex items-start justify-between gap-3">
              <span>{error}</span>
              <button onClick={generate} className="text-xs font-semibold underline flex-shrink-0">Retry</button>
            </div>
          )}

          {mode === 'skills' ? (
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
              </div>
            </div>
          )}

          <QuestionTypeSelector
            questionType={questionType} setQuestionType={setQuestionType}
          />

          <DifficultyTimer
            difficulty={difficulty} setDifficulty={setDifficulty}
            timer={timer} setTimer={setTimer}
            timerError={timerError} validateTimer={validateTimer}
            estimatedCount={estimatedCount} mode={mode}
          />

          <button
            onClick={generate}
            disabled={!canGenerate}
            className="btn-primary w-full py-2.5 rounded-btn text-sm font-semibold disabled:opacity-50"
          >
            Generate Test →
          </button>
          {!difficulty && (
            <p className="text-xs text-ds-textMuted text-center -mt-3">Select a difficulty to enable generation</p>
          )}
        </div>
        </div>
      )}

      {/* ── Step: JD input ───────────────────────────────────────────────────── */}
      {step === 'jd-input' && (
        <div className="w-full max-w-4xl mx-auto">
        <div className="card shadow-2xl p-6 space-y-4">
          {extractError && (
            <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2.5">
              {extractError}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ds-text mb-1.5">
              Job Description <span className="text-ds-danger">*</span>
            </label>
            <textarea
              value={jdText}
              onChange={e => setJdText(e.target.value)}
              rows={12}
              placeholder="Paste the full job description here…"
              maxLength={10000}
              disabled={extracting}
              className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted resize-none disabled:opacity-60"
            />
            <div className="flex items-center justify-between mt-1">
              <span className={`text-xs ${jdText.length < 100 ? 'text-ds-danger' : 'text-ds-textMuted'}`}>
                {jdText.length < 100 ? `${jdText.length}/100 minimum` : `${jdText.length}/10,000`}
              </span>
            </div>
          </div>

          <button
            onClick={extractSkills}
            disabled={jdText.trim().length < 100 || extracting}
            className="btn-primary w-full py-2.5 rounded-btn text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {extracting ? (
              <>
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Extracting skills…
              </>
            ) : (
              'Extract Skills →'
            )}
          </button>
        </div>
        </div>
      )}

      {/* ── Step: JD skills review ───────────────────────────────────────────── */}
      {step === 'jd-skills' && (
        <div className="w-full max-w-4xl mx-auto">
        <div className="card shadow-2xl p-6 space-y-5">
          {/* Undo toast */}
          {undoSkill && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 text-xs px-3 py-2 rounded flex items-center justify-between gap-3">
              <span><span className="font-semibold">{undoSkill.name}</span> removed.</span>
              <button onClick={undoRemove} className="text-xs font-semibold underline flex-shrink-0">Undo</button>
            </div>
          )}

          {/* Error from generation attempt */}
          {error && (
            <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2.5 flex items-start justify-between gap-3">
              <span>{error}</span>
              <button onClick={generate} className="text-xs font-semibold underline flex-shrink-0">Retry</button>
            </div>
          )}

          {/* Low confidence warning */}
          {lowConfCount > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
              <span className="flex-shrink-0">⚠️</span>
              <span>
                {lowConfCount} skill{lowConfCount !== 1 ? 's are' : ' is'} low-confidence — these may not reflect core requirements for this role.
              </span>
            </div>
          )}

          {/* Hard Skills */}
          {hardSkills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-2">
                Hard Skills ({hardSkills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {hardSkills.map(s => (
                  <JdChip key={s.name} skill={s} onRemove={removeJdSkill} />
                ))}
              </div>
            </div>
          )}

          {/* Soft Skills */}
          {softSkills.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-2">
                Soft Skills ({softSkills.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {softSkills.map(s => (
                  <JdChip key={s.name} skill={s} onRemove={removeJdSkill} />
                ))}
              </div>
            </div>
          )}

          {jdSkills.length === 0 && (
            <p className="text-sm text-ds-textMuted text-center py-4">All skills removed. Add at least one to continue.</p>
          )}

          {/* Add skill */}
          <div className="relative">
            <p className="text-xs font-medium text-ds-textMuted mb-1.5">Add a skill manually</p>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  ref={addSkillRef}
                  value={addSkillInput}
                  onChange={e => { setAddSkillInput(e.target.value); setShowAddSuggestions(true); }}
                  onKeyDown={e => { if (e.key === 'Enter' && addSkillInput.trim()) { e.preventDefault(); addJdSkillManual(addSkillInput); } }}
                  onFocus={() => setShowAddSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowAddSuggestions(false), 150)}
                  placeholder="Type a skill name (min 3 chars)…"
                  disabled={jdSkills.length >= 20}
                  className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted disabled:opacity-50"
                />
                {showAddSuggestions && filteredAddSuggestions.length > 0 && (
                  <div className="absolute z-20 top-full mt-1 left-0 right-0 bg-ds-card border border-ds-border rounded shadow-lg max-h-36 overflow-y-auto py-1">
                    {filteredAddSuggestions.slice(0, 8).map(s => (
                      <button key={s} type="button" onMouseDown={() => addJdSkillManual(s)}
                        className="w-full text-left px-3 py-1.5 text-sm text-ds-text hover:bg-ds-bg">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => addJdSkillManual(addSkillInput)}
                disabled={addSkillInput.trim().length < 3 || jdSkills.length >= 20}
                className="px-3 py-2 text-sm rounded border border-ds-border text-ds-textMuted hover:bg-ds-bg disabled:opacity-40 transition-colors"
              >
                + Add
              </button>
            </div>
            {jdSkills.length >= 20 && (
              <p className="text-xs text-ds-textMuted mt-1">Maximum 20 skills reached.</p>
            )}
          </div>

          {/* Collapsed JD preview */}
          <div className="border border-ds-border rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setJdPreviewOpen(o => !o)}
              className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-ds-textMuted hover:bg-ds-bg transition-colors"
            >
              <span>Original job description</span>
              <span className={`transition-transform ${jdPreviewOpen ? 'rotate-180' : ''}`}><ChevronDown /></span>
            </button>
            {jdPreviewOpen && (
              <div className="px-3 pb-3 max-h-48 overflow-y-auto">
                <p className="text-xs text-ds-textMuted whitespace-pre-wrap leading-relaxed">{jdText}</p>
              </div>
            )}
          </div>

          {/* Question types */}
          <QuestionTypeSelector
            questionType={questionType} setQuestionType={setQuestionType}
          />

          {/* Difficulty + Timer */}
          <DifficultyTimer
            difficulty={difficulty} setDifficulty={setDifficulty}
            timer={timer} setTimer={setTimer}
            timerError={timerError} validateTimer={validateTimer}
            estimatedCount={estimatedCount} mode={mode}
          />

          <button
            onClick={generate}
            disabled={!canGenerate}
            className="btn-primary w-full py-2.5 rounded-btn text-sm font-semibold disabled:opacity-50"
          >
            Generate Test →
          </button>
          {!difficulty && jdSkills.length > 0 && (
            <p className="text-xs text-ds-textMuted text-center -mt-3">Select a difficulty to enable generation</p>
          )}
        </div>
        </div>
      )}

      {/* ── Step: Generating ─────────────────────────────────────────────────── */}
      {step === 'generating' && (
        <div className="w-full max-w-4xl mx-auto">
        <div className="bg-ds-card border border-ds-border rounded-lg p-12 flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-ds-text">Generating your test questions…</p>
          <p className="text-xs text-ds-textMuted">This usually takes 10–20 seconds</p>
        </div>
        </div>
      )}

      {/* ── Step: Review ─────────────────────────────────────────────────────── */}
      {step === 'review' && session && (
        <div className="w-full max-w-4xl mx-auto">
        <div className="card shadow-2xl p-6 space-y-5">
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
              {session.mcq_count > 0 && session.short_answer_count > 0 && (
                <p className="text-[10px] text-ds-textMuted mt-0.5">{session.mcq_count} MCQ · {session.short_answer_count} SA</p>
              )}
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
          {session.short_answer_count > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2.5 text-xs text-blue-700">
              <span className="font-semibold">Short answer questions included</span> — graded automatically by AI after submission.
            </div>
          )}

          {mode === 'jd' && jdSkills.length > 0 && (
            <div className="bg-ds-bg border border-ds-border rounded-lg p-3">
              <p className="text-xs font-medium text-ds-textMuted mb-2">Skills being tested</p>
              <div className="flex flex-wrap gap-1.5">
                {jdSkills.map(s => (
                  <span key={s.name} className="chip-primary text-xs px-2 py-0.5 rounded-full font-medium">
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          <p className="text-xs text-ds-textMuted text-center">
            The timer starts the moment you begin. Navigate freely between questions before submitting.
          </p>

          <div className="flex gap-3">
            <button onClick={startTest}
              className="btn-primary flex-1 py-2.5 rounded-btn text-sm font-semibold">
              Start Test →
            </button>
            <button onClick={reset}
              className="px-4 py-2.5 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
              ← Start Over
            </button>
          </div>
        </div>
        </div>
      )}
    </div>
  );
}

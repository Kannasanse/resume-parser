'use client';
import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { PREDEFINED_SKILLS, ALL_SKILLS } from '@/data/predefined-skills';
import Questionnaire from '@/components/career-map/Questionnaire';

// ── Step indicator ──────────────────────────────────────────────────────────
function StepDots({ current }) {
  const steps = [
    { n: 1, label: 'Skills' },
    { n: 2, label: 'Preferences' },
    { n: 3, label: 'Generating' },
  ];
  return (
    <div className="flex items-center justify-center gap-8 pb-4">
      {steps.map(s => {
        const done = s.n < current;
        const active = s.n === current;
        return (
          <div key={s.n} className="flex flex-col items-center gap-1.5">
            <div className={`w-2.5 h-2.5 rounded-full flex items-center justify-center transition-colors ${
              done ? 'bg-[#1D9E75]' : active ? 'bg-[#185FA5]' : 'border-2 border-[#D1DCE8] bg-white'
            }`}>
              {done && (
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF]">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Skill chip (selected) ───────────────────────────────────────────────────
function SelectedChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1.5 h-7 pl-3 pr-2 rounded-full text-[13px] font-medium"
      style={{ background: '#E6F1FB', color: '#185FA5', border: '1px solid rgba(24,95,165,0.25)' }}>
      {label}
      <button onClick={onRemove} className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-[#185FA5] hover:text-white transition-colors text-[#185FA5]" aria-label={`Remove ${label}`}>
        <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </span>
  );
}

// ── Skill suggestion chip ───────────────────────────────────────────────────
function SuggestionChip({ label, selected, onClick }) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[13px] transition-all"
      style={selected
        ? { background: '#E6F1FB', border: '1px solid #185FA5', color: '#185FA5' }
        : { background: '#F4F8FC', border: '1px solid #D1DCE8', color: '#2C2C2A' }
      }
    >
      {selected && (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#185FA5" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
      )}
      {label}
    </button>
  );
}

// ── Quick preferences form ──────────────────────────────────────────────────
function PreferencesForm({ onSubmit, loading }) {
  const [hoursPerDay, setHoursPerDay] = useState('1');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [learningStyle, setLearningStyle] = useState('mixed');
  const [currentLevel, setCurrentLevel] = useState('beginner');

  const selectCls = "w-full border border-[#D1DCE8] rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#185FA5] focus:border-[#185FA5] transition-all bg-white";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-[#2C2C2A]">How do you want to learn?</h3>
        <p className="text-sm text-[#6B7280] mt-1">We'll build your course around your schedule and style.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Hours per day</label>
          <select value={hoursPerDay} onChange={e => setHoursPerDay(e.target.value)} className={selectCls}>
            <option value="0.5">30 minutes</option>
            <option value="1">1 hour</option>
            <option value="1.5">1.5 hours</option>
            <option value="2">2 hours</option>
            <option value="3">3 hours</option>
            <option value="4">4 hours</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Days per week</label>
          <select value={daysPerWeek} onChange={e => setDaysPerWeek(e.target.value)} className={selectCls}>
            {[2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Your current level</label>
        <select value={currentLevel} onChange={e => setCurrentLevel(e.target.value)} className={selectCls}>
          <option value="beginner">Beginner — starting from scratch</option>
          <option value="some-exposure">Some exposure — tried it briefly</option>
          <option value="intermediate">Intermediate — used it occasionally</option>
          <option value="advanced">Advanced — looking to deepen expertise</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Learning style</label>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: 'video-first', label: '▶ Video-first', desc: 'Watch then practise' },
            { value: 'reading-first', label: '📖 Reading-first', desc: 'Read then apply' },
            { value: 'project-based', label: '🛠 Project-based', desc: 'Learn by building' },
            { value: 'mixed', label: '🔀 Mixed', desc: 'Best of all approaches' },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => setLearningStyle(opt.value)}
              className={`p-3 rounded-xl border text-left transition-all ${
                learningStyle === opt.value
                  ? 'border-[#185FA5] bg-[#E6F1FB]'
                  : 'border-[#D1DCE8] bg-white hover:border-[#185FA5] hover:bg-[#F4F8FC]'
              }`}
            >
              <div className="text-xs font-semibold text-[#2C2C2A]">{opt.label}</div>
              <div className="text-[11px] text-[#6B7280] mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSubmit({ hoursPerDay: parseFloat(hoursPerDay), daysPerWeek: parseInt(daysPerWeek), learningStyle: [learningStyle], currentLevel })}
        disabled={loading}
        className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60"
        style={{ background: 'linear-gradient(135deg, #185FA5, #0C447C)' }}
      >
        {loading ? 'Generating your course…' : 'Generate my course →'}
      </button>
    </div>
  );
}

// ── Generating animation ────────────────────────────────────────────────────
function GeneratingView({ done, planId, onView }) {
  const steps = [
    'Analysing your skills…',
    'Designing your learning phases…',
    'Building week-by-week topics…',
    'Adding video content…',
    'Finalising your course…',
  ];
  const [visibleStep, setVisibleStep] = useState(0);

  useEffect(() => {
    if (done) return;
    const interval = setInterval(() => {
      setVisibleStep(prev => Math.min(prev + 1, steps.length - 1));
    }, 1400);
    return () => clearInterval(interval);
  }, [done]);

  if (done) {
    return (
      <div className="text-center py-8 space-y-4">
        <div className="w-16 h-16 rounded-full bg-[#D1FAE5] flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#2C2C2A]">Your course is ready!</h3>
          <p className="text-sm text-[#6B7280] mt-1">Your personalised study plan has been created.</p>
        </div>
        <button
          onClick={onView}
          className="w-full h-11 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #185FA5, #0C447C)' }}
        >
          View my course →
        </button>
      </div>
    );
  }

  return (
    <div className="py-8 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-full border-4 border-[#E6F1FB] border-t-[#185FA5] animate-spin mx-auto" />
        <h3 className="text-base font-semibold text-[#2C2C2A]">Building your course</h3>
      </div>
      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${i <= visibleStep ? 'opacity-100' : 'opacity-20'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              i < visibleStep ? 'bg-[#1D9E75]' : i === visibleStep ? 'bg-[#185FA5] animate-pulse' : 'bg-[#F4F8FC] border border-[#D1DCE8]'
            }`}>
              {i < visibleStep && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
            <span className={`text-sm ${i === visibleStep ? 'text-[#185FA5] font-medium' : i < visibleStep ? 'text-[#1D9E75]' : 'text-[#9CA3AF]'}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────
export default function CourseCreationModal({ open, onClose, onCreated }) {
  const router = useRouter();
  const [internalStep, setInternalStep] = useState('skills'); // skills | starting | questionnaire | preferences | generating | done
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [sessionId, setSessionId] = useState(null);
  const [qAnswers, setQAnswers] = useState([]);
  const [starting, setStarting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generatingDone, setGeneratingDone] = useState(false);
  const [planId, setPlanId] = useState(null);
  const [error, setError] = useState('');

  const dotStep = internalStep === 'skills' || internalStep === 'starting' ? 1
    : internalStep === 'questionnaire' || internalStep === 'preferences' ? 2
    : 3;

  // Reset when modal opens/closes
  useEffect(() => {
    if (open) {
      setInternalStep('skills');
      setSelectedSkills([]);
      setSearchText('');
      setSessionId(null);
      setQAnswers([]);
      setStarting(false);
      setGenerating(false);
      setGeneratingDone(false);
      setPlanId(null);
      setError('');
    }
  }, [open]);

  // ── Skill selection logic ─────────────────────────────────────────────────
  const toggleSkill = useCallback((skill) => {
    setSelectedSkills(prev => {
      if (prev.includes(skill)) return prev.filter(s => s !== skill);
      if (prev.length >= 8) return prev; // max 8
      return [...prev, skill];
    });
  }, []);

  const addCustomSkill = useCallback((text) => {
    const trimmed = text.trim();
    if (!trimmed || selectedSkills.includes(trimmed) || selectedSkills.length >= 8) return;
    setSelectedSkills(prev => [...prev, trimmed]);
    setSearchText('');
  }, [selectedSkills]);

  const filteredSuggestions = searchText.trim()
    ? ALL_SKILLS.filter(s => s.toLowerCase().includes(searchText.toLowerCase()))
    : null;

  const hasExactMatch = filteredSuggestions?.some(s => s.toLowerCase() === searchText.trim().toLowerCase());

  // ── Start questionnaire ───────────────────────────────────────────────────
  async function handleSkillsContinue() {
    if (!selectedSkills.length) return;
    setStarting(true);
    setError('');
    try {
      const r = await fetch('/api/v1/courses/create-from-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedSkills }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to start');
      setSessionId(d.sessionId);
      setInternalStep('questionnaire');
    } catch (err) {
      setError(err.message);
    } finally {
      setStarting(false);
    }
  }

  // ── Questionnaire complete ────────────────────────────────────────────────
  function handleQuestionnaireDone(answers) {
    setQAnswers(answers);
    setInternalStep('preferences');
  }

  // ── Generate plan ─────────────────────────────────────────────────────────
  async function handleGenerate(preferences) {
    setGenerating(true);
    setInternalStep('generating');
    setError('');

    const skillTitle = selectedSkills.length === 1
      ? `${selectedSkills[0]} Course`
      : selectedSkills.length === 2
      ? `${selectedSkills[0]} & ${selectedSkills[1]} Course`
      : `${selectedSkills.slice(0, 2).join(', ')} & More Course`;

    try {
      const r = await fetch('/api/v1/career-map/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          creation_mode: 'skills',
          selectedSkills,
          questionnaireAnswers: qAnswers,
          targetRoleTitle: skillTitle,
          targetRoleId: null,
          missingSkills: selectedSkills,
          preferences,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to generate');
      setPlanId(d.study_plan_id);
      setGeneratingDone(true);
      if (onCreated) onCreated(d.study_plan_id);
    } catch (err) {
      setError(err.message);
      setInternalStep('preferences');
    } finally {
      setGenerating(false);
    }
  }

  // ── Navigate to plan ──────────────────────────────────────────────────────
  function handleViewPlan() {
    onClose();
    router.push(`/career-map/study-plan/${planId}`);
  }

  // ── Close guard ───────────────────────────────────────────────────────────
  function handleClose() {
    if (internalStep === 'generating' && !generatingDone) return; // can't close while generating
    onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <StepDots current={dotStep} />
          {internalStep !== 'generating' && internalStep !== 'done' && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#9CA3AF] hover:text-[#2C2C2A] hover:bg-[#F4F8FC] transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>
          )}

          {/* ── Step 1: Skill Selection ─────────────────────────────────── */}
          {internalStep === 'skills' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#2C2C2A]">What do you want to learn?</h2>
                <p className="text-[14px] text-[#6B7280] mt-1">Choose skills to master. We'll build a personalised course around them.</p>
              </div>

              {/* Search */}
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
                <input
                  value={searchText}
                  onChange={e => setSearchText(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && searchText.trim() && !hasExactMatch) addCustomSkill(searchText); }}
                  placeholder="Search skills e.g. Python, Docker, React..."
                  className="w-full pl-10 pr-4 py-2.5 border border-[#D1DCE8] rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#185FA5] focus:border-[#185FA5] transition-all"
                />
              </div>

              {/* Selected chips */}
              {selectedSkills.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[#6B7280]">Selected ({selectedSkills.length}/8)</span>
                    {selectedSkills.length >= 2 && (
                      <button onClick={() => setSelectedSkills([])} className="text-xs text-[#D93025] hover:underline">Clear all</button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedSkills.map(s => (
                      <SelectedChip key={s} label={s} onRemove={() => toggleSkill(s)} />
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              <div className="space-y-4 max-h-72 overflow-y-auto pr-1">
                {filteredSuggestions ? (
                  <div>
                    <div className="flex flex-wrap gap-2">
                      {filteredSuggestions.map(s => (
                        <SuggestionChip
                          key={s}
                          label={s}
                          selected={selectedSkills.includes(s)}
                          onClick={() => toggleSkill(s)}
                        />
                      ))}
                      {!hasExactMatch && searchText.trim() && (
                        <button
                          onClick={() => addCustomSkill(searchText)}
                          className="inline-flex items-center gap-1.5 h-8 px-3.5 rounded-full text-[13px] transition-all"
                          style={{ background: '#FEF3C7', border: '1px dashed #F59E0B', color: '#B45309' }}
                        >
                          + Add "{searchText.trim()}" as custom skill
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  Object.entries(PREDEFINED_SKILLS).map(([category, skills]) => (
                    <div key={category}>
                      <p className="text-[11px] uppercase tracking-widest text-[#9CA3AF] mb-2">{category}</p>
                      <div className="flex flex-wrap gap-2">
                        {skills.map(s => (
                          <SuggestionChip
                            key={s}
                            label={s}
                            selected={selectedSkills.includes(s)}
                            onClick={() => toggleSkill(s)}
                          />
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Continue button */}
              <button
                onClick={handleSkillsContinue}
                disabled={!selectedSkills.length || starting}
                className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: selectedSkills.length ? 'linear-gradient(135deg, #185FA5, #0C447C)' : '#D1DCE8' }}
              >
                {starting ? 'Starting…' : selectedSkills.length ? `Continue with ${selectedSkills.length} skill${selectedSkills.length > 1 ? 's' : ''} →` : 'Select at least one skill'}
              </button>
            </div>
          )}

          {/* ── Step 2a: Questionnaire ──────────────────────────────────── */}
          {internalStep === 'questionnaire' && sessionId && (
            <div>
              <div className="mb-4">
                <h2 className="text-xl font-bold text-[#2C2C2A]">A few quick questions</h2>
                <p className="text-[14px] text-[#6B7280] mt-1">Help us personalise your {selectedSkills.slice(0,2).join(' & ')} course.</p>
              </div>
              <Questionnaire
                mode="skills"
                selectedSkills={selectedSkills}
                sessionId={sessionId}
                profile={null}
                loading={false}
                onSubmit={handleQuestionnaireDone}
              />
            </div>
          )}

          {/* ── Step 2b: Preferences form ───────────────────────────────── */}
          {internalStep === 'preferences' && (
            <PreferencesForm onSubmit={handleGenerate} loading={generating} />
          )}

          {/* ── Step 3: Generating ──────────────────────────────────────── */}
          {internalStep === 'generating' && (
            <GeneratingView done={generatingDone} planId={planId} onView={handleViewPlan} />
          )}
        </div>
      </div>
    </div>
  );
}

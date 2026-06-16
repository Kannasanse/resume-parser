'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Questionnaire from '@/components/career-map/Questionnaire';
import SkillLookupInput from '@/components/skills/SkillLookupInput';

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
              done ? 'bg-[#1D9E75]' : active ? 'bg-[#185FA5]' : 'border-2 border-[#D1DCE8] dark:border-white/20 bg-white dark:bg-[#111F35]'
            }`}>
              {done && (
                <svg width="7" height="7" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              )}
            </div>
            <span className="text-[10px] uppercase tracking-widest text-[#9CA3AF] dark:text-[#4A6380]">{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ── Quick preferences form ──────────────────────────────────────────────────
function PreferencesForm({ onSubmit, loading }) {
  const [hoursPerDay, setHoursPerDay] = useState('1');
  const [daysPerWeek, setDaysPerWeek] = useState('5');
  const [learningStyle, setLearningStyle] = useState('mixed');
  const [currentLevel, setCurrentLevel] = useState('beginner');

  const selectCls = "w-full border border-[#D1DCE8] dark:border-white/10 rounded-xl px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#185FA5] focus:border-[#185FA5] transition-all bg-white dark:bg-[#0F1A2E] dark:text-[#E8EFF7]";

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">How do you want to learn?</h3>
        <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1] mt-1">We'll build your course around your schedule and style.</p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#8BA3C1]">Hours per day</label>
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
          <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#8BA3C1]">Days per week</label>
          <select value={daysPerWeek} onChange={e => setDaysPerWeek(e.target.value)} className={selectCls}>
            {[2,3,4,5,6,7].map(d => <option key={d} value={d}>{d} days</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#8BA3C1]">Your current level</label>
        <select value={currentLevel} onChange={e => setCurrentLevel(e.target.value)} className={selectCls}>
          <option value="beginner">Beginner — starting from scratch</option>
          <option value="some-exposure">Some exposure — tried it briefly</option>
          <option value="intermediate">Intermediate — used it occasionally</option>
          <option value="advanced">Advanced — looking to deepen expertise</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-[#6B7280] dark:text-[#8BA3C1]">Learning style</label>
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
                  ? 'border-[#185FA5] bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.20)]'
                  : 'border-[#D1DCE8] dark:border-white/10 bg-white dark:bg-[#111F35] hover:border-[#185FA5] hover:bg-[#F4F8FC] dark:hover:bg-[#0D1830]'
              }`}
            >
              <div className="text-xs font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">{opt.label}</div>
              <div className="text-[11px] text-[#6B7280] dark:text-[#8BA3C1] mt-0.5">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => onSubmit({ hoursPerDay: parseFloat(hoursPerDay), daysPerWeek: parseInt(daysPerWeek), learningStyle: [learningStyle], currentLevel })}
        disabled={loading}
        className="w-full h-11 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-60 flex items-center justify-center gap-2"
        style={{ background: 'linear-gradient(135deg, #185FA5, #0C447C)' }}
      >
        {loading ? 'Generating your course…' : (
          <>
            Generate my course
            <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 4, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>5 credits</span>
          </>
        )}
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
        <div className="w-16 h-16 rounded-full bg-[#D1FAE5] dark:bg-[rgba(29,158,117,0.20)] flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">Your course is ready!</h3>
          <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1] mt-1">Your personalised study plan has been created.</p>
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
        <div className="w-12 h-12 rounded-full border-4 border-[#E6F1FB] dark:border-[rgba(24,95,165,0.20)] border-t-[#185FA5] animate-spin mx-auto" />
        <h3 className="text-base font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">Building your course</h3>
      </div>
      <div className="space-y-2.5">
        {steps.map((s, i) => (
          <div key={i} className={`flex items-center gap-3 transition-opacity duration-500 ${i <= visibleStep ? 'opacity-100' : 'opacity-20'}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
              i < visibleStep ? 'bg-[#1D9E75]' : i === visibleStep ? 'bg-[#185FA5] animate-pulse' : 'bg-[#F4F8FC] dark:bg-[#0D1830] border border-[#D1DCE8] dark:border-white/10'
            }`}>
              {i < visibleStep && (
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              )}
            </div>
            <span className={`text-sm ${i === visibleStep ? 'text-[#185FA5] dark:text-[#5B9FD4] font-medium' : i < visibleStep ? 'text-[#1D9E75] dark:text-[#34C68A]' : 'text-[#9CA3AF] dark:text-[#4A6380]'}`}>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Modal ──────────────────────────────────────────────────────────────
export default function CourseCreationModal({ open, onClose, onCreated }) {
  const router = useRouter();
  const [internalStep, setInternalStep] = useState('skills');
  const [selectedSkills, setSelectedSkills] = useState([]);
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
      setSessionId(null);
      setQAnswers([]);
      setStarting(false);
      setGenerating(false);
      setGeneratingDone(false);
      setPlanId(null);
      setError('');
    }
  }, [open]);

  // ── Start questionnaire ───────────────────────────────────────────────────
  async function handleSkillsContinue() {
    if (!selectedSkills.length) return;
    setStarting(true);
    setError('');
    try {
      const r = await fetch('/api/v1/courses/create-from-skills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedSkills: selectedSkills.map(s => s.name) }),
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

    const skillNames = selectedSkills.map(s => s.name);
    const skillTitle = skillNames.length === 1
      ? `${skillNames[0]} Course`
      : skillNames.length === 2
      ? `${skillNames[0]} & ${skillNames[1]} Course`
      : `${skillNames.slice(0, 2).join(', ')} & More Course`;

    try {
      const r = await fetch('/api/v1/career-map/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          creation_mode: 'skills',
          selectedSkills: skillNames,
          questionnaireAnswers: qAnswers,
          targetRoleTitle: skillTitle,
          targetRoleId: null,
          missingSkills: skillNames,
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
      <div className="relative w-full max-w-lg bg-white dark:bg-[#111F35] rounded-[20px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 pt-6 pb-2 flex-shrink-0">
          <StepDots current={dotStep} />
          {internalStep !== 'generating' && internalStep !== 'done' && (
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#2C2C2A] dark:hover:text-[#E8EFF7] hover:bg-[#F4F8FC] dark:hover:bg-[#0D1830] transition-colors"
              aria-label="Close"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">
              {error}
              {error.toLowerCase().includes('insufficient') && (
                <a href="/credits" className="block mt-1 font-semibold underline">Get more credits →</a>
              )}
            </div>
          )}

          {/* ── Step 1: Skill Selection ─────────────────────────────────── */}
          {internalStep === 'skills' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">What do you want to learn?</h2>
                <p className="text-[14px] text-[#6B7280] dark:text-[#8BA3C1] mt-1">Choose skills to master. We'll build a personalised course around them.</p>
              </div>

              <SkillLookupInput
                selectedSkills={selectedSkills}
                onChange={setSelectedSkills}
                maxSkills={8}
                placeholder="Search skills e.g. Python, Docker, React…"
              />

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
                <h2 className="text-xl font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">A few quick questions</h2>
                <p className="text-[14px] text-[#6B7280] dark:text-[#8BA3C1] mt-1">Help us personalise your {selectedSkills.slice(0,2).map(s => s.name).join(' & ')} course.</p>
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

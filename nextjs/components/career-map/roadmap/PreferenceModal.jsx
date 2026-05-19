'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const DAYS_OPTIONS = [2, 3, 4, 5, 6, 7];
const STYLE_OPTIONS = [
  { value: 'video-first', icon: '📹', label: 'Video-first', desc: 'Watch tutorials then practice' },
  { value: 'reading-first', icon: '📖', label: 'Reading-first', desc: 'Read theory then watch videos' },
  { value: 'project-based', icon: '🛠', label: 'Project-based', desc: 'Learn by building things' },
  { value: 'mixed', icon: '🔀', label: 'Mixed', desc: 'A balanced combination' },
];
const LEVEL_OPTIONS = [
  { value: 'beginner', label: 'Complete beginner', desc: 'I have no experience with this yet' },
  { value: 'some-exposure', label: 'Some exposure', desc: "I've tried it but never used it professionally" },
  { value: 'intermediate', label: 'Intermediate', desc: 'I use it occasionally in my work' },
  { value: 'advanced', label: 'Advanced', desc: "I'm confident but need specific gaps filled" },
];

function inferLevel(readinessScore) {
  if (!readinessScore) return 'beginner';
  if (readinessScore <= 30) return 'beginner';
  if (readinessScore <= 60) return 'some-exposure';
  if (readinessScore <= 80) return 'intermediate';
  return 'advanced';
}

function formatStyle(style) {
  if (Array.isArray(style)) return style.join(', ');
  return style || '';
}

export default function PreferenceModal({
  open, onClose,
  // create mode
  sessionId, targetRoleId, targetRoleTitle, missingSkills, readinessScore,
  // edit mode — pass this to enable edit mode
  existingPlan,   // { id, preferences, totalHours, totalWeeks, targetRoleTitle }
  onPlanUpdated,  // callback(msg) after successful update
}) {
  const isEditMode = !!existingPlan;
  const router = useRouter();
  const [view, setView] = useState('form'); // 'form' | 'confirm'
  const [hoursPerDay, setHoursPerDay] = useState(1.5);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [learningStyle, setLearningStyle] = useState(['mixed']);
  const [currentLevel, setCurrentLevel] = useState('beginner');
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  // Reset form when modal opens
  useEffect(() => {
    if (!open) return;
    setView('form');
    setError('');
    setGenerating(false);
    if (isEditMode && existingPlan?.preferences) {
      const p = existingPlan.preferences;
      setHoursPerDay(p.hoursPerDay ?? 1.5);
      setDaysPerWeek(p.daysPerWeek ?? 5);
      setLearningStyle(Array.isArray(p.learningStyle) ? p.learningStyle : [p.learningStyle || 'mixed']);
      setCurrentLevel(p.currentLevel ?? 'beginner');
    } else {
      setHoursPerDay(1.5);
      setDaysPerWeek(5);
      setLearningStyle(['mixed']);
      setCurrentLevel(inferLevel(readinessScore));
    }
  }, [open, isEditMode]);

  const effectiveTitle = isEditMode ? (existingPlan?.targetRoleTitle || targetRoleTitle) : targetRoleTitle;
  const totalHoursNeeded = isEditMode ? (existingPlan?.totalHours || 50) : ((missingSkills?.length || 1) * 25);
  const weeklyHours = hoursPerDay * daysPerWeek;
  const estimatedWeeks = Math.ceil(totalHoursNeeded / weeklyHours);
  const oldEstimatedWeeks = isEditMode ? existingPlan?.totalWeeks : null;
  const weeksChanged = isEditMode && estimatedWeeks !== oldEstimatedWeeks;
  const totalTopics = isEditMode ? null : Math.max(missingSkills?.length || 1, 1) * 2;

  function getChanges() {
    if (!isEditMode || !existingPlan?.preferences) return [];
    const old = existingPlan.preferences;
    const changes = [];
    if (old.hoursPerDay !== hoursPerDay) changes.push(`Study time: ${old.hoursPerDay} hrs/day → ${hoursPerDay} hrs/day`);
    if (old.daysPerWeek !== daysPerWeek) changes.push(`Days/week: ${old.daysPerWeek} → ${daysPerWeek} days`);
    const oldStyle = formatStyle(old.learningStyle);
    const newStyle = formatStyle(learningStyle);
    if (oldStyle !== newStyle) changes.push(`Learning style: ${oldStyle} → ${newStyle}`);
    if (old.currentLevel !== currentLevel) changes.push(`Level: ${old.currentLevel} → ${currentLevel}`);
    return changes;
  }

  function toggleStyle(val) {
    setLearningStyle(prev =>
      prev.includes(val) ? (prev.length > 1 ? prev.filter(v => v !== val) : prev) : [...prev, val]
    );
  }

  async function handleCreate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/v1/career-map/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId, targetRoleId, targetRoleTitle,
          missingSkills: missingSkills || [],
          preferences: { hoursPerDay, daysPerWeek, learningStyle, currentLevel },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      fetch('/api/v1/career-map/fetch-youtube-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ study_plan_id: data.study_plan_id }),
      }).catch(() => {});

      router.push(`/career-map/study-plan/${data.study_plan_id}`);
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to generate plan');
      setGenerating(false);
    }
  }

  async function handleUpdate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/v1/career-map/update-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: existingPlan.id,
          preferences: { hoursPerDay, daysPerWeek, learningStyle, currentLevel },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Re-fetch videos if style changed
      const oldStyle = formatStyle(existingPlan.preferences?.learningStyle || []);
      const newStyle = formatStyle(learningStyle);
      if (oldStyle !== newStyle) {
        fetch('/api/v1/career-map/fetch-youtube-videos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ study_plan_id: existingPlan.id }),
        }).catch(() => {});
      }

      onPlanUpdated?.('Study plan updated. Your progress has been preserved.');
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to update plan');
      setGenerating(false);
    }
  }

  function handlePrimaryAction() {
    if (isEditMode) {
      setView('confirm');
    } else {
      handleCreate();
    }
  }

  if (!open) return null;

  const changes = getChanges();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">

        {view === 'form' && (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-[var(--c-border)]">
              <h2 className="text-lg font-semibold text-[var(--c-text)]">
                {isEditMode ? 'Update your study preferences' : 'Personalise your study plan'}
              </h2>
              <p className="text-sm text-[var(--c-text-muted)] mt-1">
                {isEditMode
                  ? 'Changes will regenerate your plan structure while preserving your completed progress.'
                  : 'Tell us how much time you can dedicate and how you like to learn.'}
              </p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
              {error && <div className="ds-alert ds-alert-error">{error}</div>}

              {/* Hours per day */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--c-text)]">
                  How many hours can you study per day?
                  <span className="ml-2 font-semibold text-[var(--c-primary)]">{hoursPerDay} hrs/day</span>
                </label>
                <input
                  type="range" min={0.5} max={8} step={0.5}
                  value={hoursPerDay}
                  onChange={e => setHoursPerDay(parseFloat(e.target.value))}
                  className="w-full accent-[var(--c-primary)]"
                />
                <div className="relative h-4">
                  {[0.5, 1, 2, 3, 4, 5, 6, 7, 8].map(v => (
                    <span key={v} className="absolute text-xs text-[var(--c-text-muted)] -translate-x-1/2"
                      style={{ left: `${((v - 0.5) / 7.5) * 100}%` }}>{v}</span>
                  ))}
                </div>
              </div>

              {/* Days per week */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--c-text)]">How many days per week?</label>
                <div className="flex gap-2 flex-wrap">
                  {DAYS_OPTIONS.map(d => (
                    <button key={d} onClick={() => setDaysPerWeek(d)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${daysPerWeek === d ? 'bg-[var(--c-primary)] text-white border-[var(--c-primary)]' : 'border-[var(--c-border)] text-[var(--c-text)] hover:border-[var(--c-primary)]'}`}>
                      {d} days
                    </button>
                  ))}
                </div>
              </div>

              {/* Learning style */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--c-text)]">
                  How do you prefer to learn? <span className="text-xs text-[var(--c-text-muted)]">(select all that apply)</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {STYLE_OPTIONS.map(opt => {
                    const sel = learningStyle.includes(opt.value);
                    return (
                      <button key={opt.value} onClick={() => toggleStyle(opt.value)}
                        className={`text-left p-3 rounded-xl border transition-all ${sel ? 'border-2 border-[var(--c-primary)] bg-[var(--c-primary-light)]' : 'border border-[var(--c-border)] hover:border-[var(--c-primary)]'}`}>
                        <span className="text-lg">{opt.icon}</span>
                        <p className="text-sm font-semibold text-[var(--c-text)] mt-1">{opt.label}</p>
                        <p className="text-xs text-[var(--c-text-muted)]">{opt.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Current level */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-[var(--c-text)]">
                  What's your current level with {effectiveTitle}?
                </label>
                <div className="space-y-2">
                  {LEVEL_OPTIONS.map(opt => (
                    <label key={opt.value} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all ${currentLevel === opt.value ? 'border-2 border-[var(--c-primary)] bg-[var(--c-primary-light)]' : 'border border-[var(--c-border)] hover:border-[var(--c-primary)]'}`}>
                      <input type="radio" name="level" value={opt.value} checked={currentLevel === opt.value}
                        onChange={() => setCurrentLevel(opt.value)} className="accent-[var(--c-primary)] mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--c-text)]">{opt.label}</p>
                        <p className="text-xs text-[var(--c-text-muted)]">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-[var(--c-primary-light)] rounded-xl p-4 space-y-1.5">
                <p className="text-sm text-[var(--c-primary)]">
                  📅 Estimated completion:{' '}
                  {weeksChanged ? (
                    <>
                      <span className="line-through text-[#9CA3AF] text-xs mr-1">~{oldEstimatedWeeks}w</span>
                      <strong>{estimatedWeeks} weeks</strong>
                    </>
                  ) : (
                    <strong>{estimatedWeeks} weeks</strong>
                  )}
                </p>
                <p className="text-sm text-[var(--c-primary)]">⏱ Total study time: <strong>~{totalHoursNeeded} hours</strong></p>
                {!isEditMode && totalTopics && (
                  <p className="text-sm text-[var(--c-primary)]">📚 <strong>{totalTopics} topics</strong> across <strong>{missingSkills?.length || 0} skills</strong></p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-[var(--c-border)] flex gap-3">
              <button onClick={onClose} disabled={generating}
                className="flex-1 border border-[var(--c-border)] text-[var(--c-text)] text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                Cancel
              </button>
              <button onClick={handlePrimaryAction} disabled={generating}
                className="flex-1 bg-[var(--c-primary)] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    {isEditMode ? 'Updating…' : 'Generating…'}
                  </>
                ) : isEditMode ? 'Update my plan →' : 'Generate my plan →'}
              </button>
            </div>
          </>
        )}

        {view === 'confirm' && (
          <>
            <div className="px-6 pt-6 pb-4 border-b border-[var(--c-border)]">
              <h2 className="text-lg font-semibold text-[var(--c-text)]">Update study plan?</h2>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {error && <div className="ds-alert ds-alert-error">{error}</div>}
              <p className="text-sm text-[var(--c-text-muted)]">Updating your preferences will regenerate your study plan structure.</p>

              <div className="space-y-2">
                {[
                  { icon: '✓', text: 'Your progress (completed sections) will be preserved', ok: true },
                  { icon: '✓', text: 'Generated content for completed sections will be preserved', ok: true },
                  { icon: '✗', text: 'Topics and section order may change', ok: false },
                  { icon: '✗', text: 'In-progress (unread) sections will be reset', ok: false },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className={item.ok ? 'text-green-600 font-bold' : 'text-red-500 font-bold'}>{item.icon}</span>
                    <span className={item.ok ? 'text-[var(--c-text)]' : 'text-[var(--c-text-muted)]'}>{item.text}</span>
                  </div>
                ))}
              </div>

              {changes.length > 0 && (
                <div className="bg-[#F4F8FC] rounded-lg p-3 space-y-1.5">
                  <p className="text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wide">What's changing</p>
                  {changes.map((c, i) => (
                    <p key={i} className="text-xs text-[var(--c-text-muted)]">{c}</p>
                  ))}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[var(--c-border)] flex gap-3">
              <button onClick={() => setView('form')} disabled={generating}
                className="flex-1 border border-[var(--c-border)] text-[var(--c-text)] text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
                Back
              </button>
              <button onClick={handleUpdate} disabled={generating}
                className="flex-1 bg-[var(--c-primary)] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {generating ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                    Updating…
                  </>
                ) : 'Update plan'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

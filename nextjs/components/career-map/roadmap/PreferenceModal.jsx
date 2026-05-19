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

export default function PreferenceModal({ open, onClose, sessionId, targetRoleId, targetRoleTitle, missingSkills, readinessScore }) {
  const router = useRouter();
  const [hoursPerDay, setHoursPerDay] = useState(1.5);
  const [daysPerWeek, setDaysPerWeek] = useState(5);
  const [learningStyle, setLearningStyle] = useState(['mixed']);
  const [currentLevel, setCurrentLevel] = useState(() => inferLevel(readinessScore));
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setCurrentLevel(inferLevel(readinessScore));
  }, [readinessScore]);

  const weeklyHours = hoursPerDay * daysPerWeek;
  const avgHoursPerSkill = 25;
  const totalHoursNeeded = (missingSkills?.length || 1) * avgHoursPerSkill;
  const estimatedWeeks = Math.ceil(totalHoursNeeded / weeklyHours);
  const totalTopics = Math.max(missingSkills?.length || 1, 1) * 2;

  function toggleStyle(val) {
    setLearningStyle(prev =>
      prev.includes(val) ? (prev.length > 1 ? prev.filter(v => v !== val) : prev) : [...prev, val]
    );
  }

  async function handleGenerate() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/v1/career-map/generate-study-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          targetRoleId,
          targetRoleTitle,
          missingSkills: missingSkills || [],
          preferences: { hoursPerDay, daysPerWeek, learningStyle, currentLevel },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Fire-and-forget YouTube fetch
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-[var(--c-border)]">
          <h2 className="text-lg font-semibold text-[var(--c-text)]">Personalise your study plan</h2>
          <p className="text-sm text-[var(--c-text-muted)] mt-1">Tell us how much time you can dedicate and how you like to learn.</p>
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
                <span
                  key={v}
                  className="absolute text-xs text-[var(--c-text-muted)] -translate-x-1/2"
                  style={{ left: `${((v - 0.5) / 7.5) * 100}%` }}
                >
                  {v}
                </span>
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
            <label className="block text-sm font-medium text-[var(--c-text)]">How do you prefer to learn? <span className="text-xs text-[var(--c-text-muted)]">(select all that apply)</span></label>
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
            <label className="block text-sm font-medium text-[var(--c-text)]">What's your current level with {targetRoleTitle}?</label>
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
            <p className="text-sm text-[var(--c-primary)]">📅 Estimated completion: <strong>{estimatedWeeks} weeks</strong></p>
            <p className="text-sm text-[var(--c-primary)]">⏱ Total study time: <strong>~{totalHoursNeeded} hours</strong></p>
            <p className="text-sm text-[var(--c-primary)]">📚 <strong>{totalTopics} topics</strong> across <strong>{missingSkills?.length || 0} skills</strong></p>
          </div>
        </div>

        {/* Actions */}
        <div className="px-6 py-4 border-t border-[var(--c-border)] flex gap-3">
          <button onClick={onClose} disabled={generating}
            className="flex-1 border border-[var(--c-border)] text-[var(--c-text)] text-sm font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            Cancel
          </button>
          <button onClick={handleGenerate} disabled={generating}
            className="flex-1 bg-[var(--c-primary)] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {generating ? (
              <>
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                Generating…
              </>
            ) : 'Generate my plan →'}
          </button>
        </div>
      </div>
    </div>
  );
}

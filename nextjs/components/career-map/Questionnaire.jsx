'use client';
import { useState } from 'react';

const QUESTIONS = [
  {
    id: 'goal',
    label: 'What is your primary career goal?',
    type: 'radio',
    options: [
      { value: 'promotion', label: 'Get promoted in my current field' },
      { value: 'pivot', label: 'Pivot to a new field' },
      { value: 'senior', label: 'Move into a senior / leadership role' },
      { value: 'salary', label: 'Increase my salary' },
      { value: 'explore', label: 'Explore my options' },
    ],
  },
  {
    id: 'timeline',
    label: 'What is your timeline?',
    type: 'radio',
    options: [
      { value: '3months', label: 'Within 3 months' },
      { value: '6months', label: '3–6 months' },
      { value: '1year', label: '6–12 months' },
      { value: '2years', label: '1–2 years' },
    ],
  },
  {
    id: 'work_style',
    label: 'Preferred work style',
    type: 'radio',
    options: [
      { value: 'individual', label: 'Individual contributor' },
      { value: 'management', label: 'People management' },
      { value: 'technical_lead', label: 'Technical leadership' },
      { value: 'no_preference', label: 'No preference' },
    ],
  },
  {
    id: 'interested_areas',
    label: 'Which areas interest you? (pick all that apply)',
    type: 'checkbox',
    options: [
      { value: 'engineering', label: 'Engineering / Development' },
      { value: 'data', label: 'Data / AI' },
      { value: 'product', label: 'Product Management' },
      { value: 'design', label: 'Design / UX' },
      { value: 'devops', label: 'DevOps / Cloud' },
      { value: 'marketing', label: 'Growth / Marketing' },
    ],
  },
];

export default function Questionnaire({ profile, onSubmit, loading }) {
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function setAnswer(id, value) {
    setAnswers(prev => ({ ...prev, [id]: value }));
  }

  function toggleCheckbox(id, value) {
    setAnswers(prev => {
      const current = prev[id] || [];
      return { ...prev, [id]: current.includes(value) ? current.filter(v => v !== value) : [...current, value] };
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSubmitting(true);
    await onSubmit(answers);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="ds-card p-8 text-center space-y-4">
        <div className="ds-skel h-4 w-48 mx-auto rounded" />
        <div className="ds-skel h-4 w-64 mx-auto rounded" />
        <p className="text-sm text-[var(--c-text-muted)] mt-2">Analysing your resume…</p>
      </div>
    );
  }

  const allAnswered = QUESTIONS.filter(q => q.type === 'radio').every(q => answers[q.id]);

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {profile && (
        <div className="ds-card p-4 flex items-start gap-3">
          <div className="stat-icon flex-shrink-0" style={{ width: 36, height: 36, borderRadius: 8 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--c-text)]">{profile.current_title || 'Professional'}</p>
            <p className="text-xs text-[var(--c-text-muted)]">{profile.years_experience || 0} years experience · {(profile.skills || []).slice(0, 4).join(', ')}</p>
          </div>
        </div>
      )}

      {QUESTIONS.map(q => (
        <div key={q.id} className="ds-card p-5 space-y-3">
          <p className="text-sm font-semibold text-[var(--c-text)]">{q.label}</p>
          <div className="space-y-2">
            {q.options.map(opt => (
              <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                <input
                  type={q.type}
                  name={q.id}
                  value={opt.value}
                  checked={q.type === 'radio' ? answers[q.id] === opt.value : (answers[q.id] || []).includes(opt.value)}
                  onChange={() => q.type === 'radio' ? setAnswer(q.id, opt.value) : toggleCheckbox(q.id, opt.value)}
                  className="accent-[var(--c-primary)]"
                />
                <span className="text-sm text-[var(--c-text)] group-hover:text-[var(--c-primary)]">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      ))}

      <button
        type="submit"
        disabled={submitting || !allAnswered}
        className="w-full bg-[var(--c-primary)] text-white font-medium py-2.5 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-50"
      >
        {submitting ? 'Finding roles…' : 'Get Recommendations →'}
      </button>
    </form>
  );
}

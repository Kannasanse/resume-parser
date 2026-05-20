'use client';
import { useState } from 'react';

function buildQuestions(profile) {
  const domain = profile?.currentDomain || profile?.current_domain || 'your field';
  const seniority = profile?.currentSeniority || profile?.current_title || 'your current level';
  const industries = Array.isArray(profile?.industries) && profile.industries.length
    ? profile.industries.join(', ')
    : 'your industry';
  const primaryIndustry = Array.isArray(profile?.industries) && profile.industries[0]
    ? profile.industries[0]
    : 'your industry';

  return [
    {
      id: 'goal',
      question: "What's your primary career goal right now?",
      context: "We'll use this to focus your recommendations.",
      type: 'single',
      options: [
        { value: 'grow', icon: '🚀', label: 'Grow in my current field', desc: `Move up within ${domain} — more responsibility, higher seniority` },
        { value: 'transition', icon: '🔄', label: 'Transition to a new field', desc: 'Explore adjacent or completely different career paths' },
        { value: 'leadership', icon: '⚡', label: 'Accelerate to leadership', desc: 'Move into management, team lead, or director roles' },
        { value: 'explore', icon: '🌍', label: 'Explore my options', desc: "I'm open — show me what's possible based on my skills" },
      ],
    },
    {
      id: 'timeline',
      question: 'How soon are you looking to make your next career move?',
      context: 'This helps us separate short-term achievable steps from long-term goals.',
      type: 'single',
      options: [
        { value: '6months', icon: '📅', label: 'Within 6 months', desc: "I'm actively looking or planning to move very soon" },
        { value: '6_12months', icon: '📆', label: '6 months – 1 year', desc: 'I want to prepare and move within the year' },
        { value: '1_2years', icon: '🗓', label: '1–2 years', desc: "I'm planning ahead — building skills, not rushing" },
        { value: '3_5years', icon: '🔭', label: '3–5 years', desc: 'Long-term planning — I want to see the full picture' },
      ],
    },
    {
      id: 'work_style',
      question: 'What kind of work environment do you prefer?',
      context: 'This helps filter roles that match your preferred way of working.',
      type: 'single',
      options: [
        { value: 'technical', icon: '💻', label: 'Technical / hands-on', desc: 'I want to stay close to code, design, or technical execution' },
        { value: 'people', icon: '🤝', label: 'People & collaboration', desc: 'I enjoy managing teams, stakeholders, or clients' },
        { value: 'strategy', icon: '📊', label: 'Strategy & analysis', desc: 'I prefer data, planning, and big-picture thinking' },
        { value: 'creative', icon: '🎨', label: 'Creative & product', desc: 'I want to shape products, experiences, or brand' },
      ],
    },
    {
      id: 'seniority_ambition',
      question: 'Where do you see yourself in terms of seniority?',
      context: `You're currently at ${seniority} level. Where are you aiming?`,
      type: 'single',
      options: [
        { value: 'next_level', icon: '📈', label: 'Next level up', desc: `Focused growth in ${domain} — same domain, one step up` },
        { value: 'skip_level', icon: '🏆', label: 'Skip a level', desc: 'Ambitious — aiming for Lead or Principal faster than average' },
        { value: 'management', icon: '👔', label: 'Into management', desc: 'Transition from individual contributor to people management' },
        { value: 'lateral_pivot', icon: '🔀', label: 'Same level, new domain', desc: `Stay at ${seniority} but pivot to a different field` },
      ],
    },
    {
      id: 'learning_commitment',
      question: 'How much time are you willing to invest in learning new skills?',
      context: "We'll show paths that match your learning commitment.",
      type: 'single',
      options: [
        { value: 'minimal', icon: '⚡', label: 'Minimal (< 5 hrs/week)', desc: 'I want paths that build on what I already know' },
        { value: 'moderate', icon: '📚', label: 'Moderate (5–10 hrs/week)', desc: "I'm happy to learn but want achievable milestones" },
        { value: 'high', icon: '🎓', label: 'High (10–20 hrs/week)', desc: "I'm committed — show me ambitious paths even if they're challenging" },
        { value: 'full', icon: '🏫', label: 'Full commitment', desc: "I'd consider a bootcamp, course, or certification programme" },
      ],
    },
    {
      id: 'industry_preference',
      question: 'Do you want to stay in your current industry or explore others?',
      context: `You've worked in ${industries}.`,
      type: 'single',
      options: [
        { value: 'stay', icon: '🏠', label: `Stay in ${primaryIndustry}`, desc: 'I know this space well and want to grow within it' },
        { value: 'any', icon: '🌐', label: 'Open to any industry', desc: 'The role matters more than the industry' },
        { value: 'specific', icon: '🎯', label: 'Specific industries', desc: 'I have particular industries in mind' },
        { value: 'switch', icon: '🔄', label: 'Actively want to switch', desc: `I specifically want to move out of ${primaryIndustry}` },
      ],
    },
    {
      id: 'salary_priority',
      question: 'How important is salary growth in your next move?',
      context: "We'll factor this into ranking your recommended paths.",
      type: 'single',
      options: [
        { value: 'top_priority', icon: '💰', label: 'Top priority', desc: 'I want the highest-paying paths highlighted first' },
        { value: 'balanced', icon: '📊', label: 'Important but not the only factor', desc: 'Balance salary with growth potential and job satisfaction' },
        { value: 'growth_over_pay', icon: '🌱', label: 'Growth over immediate pay', desc: "I'm willing to take a lateral pay move for the right opportunity" },
        { value: 'not_deciding', icon: '🤷', label: 'Not a deciding factor', desc: "Show me everything — I'll evaluate salary myself" },
      ],
    },
  ];
}

export default function Questionnaire({ profile, onSubmit, loading }) {
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const questions = buildQuestions(profile);
  const q = questions[current];
  const total = questions.length;
  const progress = ((current) / total) * 100;
  const selected = answers[q?.id];

  function selectOption(value) {
    setAnswers(prev => ({ ...prev, [q.id]: value }));
  }

  function goBack() {
    if (current > 0) setCurrent(c => c - 1);
  }

  async function goNext() {
    if (current < total - 1) {
      setCurrent(c => c + 1);
    } else {
      setSubmitting(true);
      await onSubmit(answers);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="ds-card p-10 text-center space-y-5">
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

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Progress */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs text-[var(--c-text-muted)]">Question {current + 1} of {total}</span>
          <span className="text-gradient-primary font-semibold text-sm">{Math.round(((current + 1) / total) * 100)}%</span>
        </div>
        <div className="bg-[rgba(24,95,165,0.12)] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#185FA5] to-[#1D9E75] h-full rounded-full transition-all duration-500"
            style={{ width: `${((current + 1) / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="card shadow-2xl animate-fade-in-scale p-8">
        <h3 className="text-xl font-semibold text-[var(--c-text)] mb-2">{q.question}</h3>
        <p className="text-sm text-[var(--c-text-muted)] mb-7">{q.context}</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {q.options.map(opt => {
            const isSelected = selected === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => selectOption(opt.value)}
                className={`relative text-left transition-all duration-200 ${
                  isSelected
                    ? 'border-2 border-[var(--c-primary)] bg-gradient-to-br from-[#E6F1FB] to-[#F4F8FC] shadow-glow-primary scale-[1.01] rounded-2xl p-[18px_20px]'
                    : 'border-[1.5px] border-[var(--c-border)] rounded-2xl p-[18px_20px] hover:border-[rgba(24,95,165,0.4)] hover:shadow-sm hover:translate-x-1'
                }`}
              >
                {isSelected && (
                  <span className="absolute top-3 right-3 text-[var(--c-primary)]">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/>
                    </svg>
                  </span>
                )}
                <div className="flex items-start gap-3">
                  <span className="text-xl flex-shrink-0 mt-0.5">{opt.icon}</span>
                  <div>
                    <p className="text-sm font-semibold text-[var(--c-text)]">{opt.label}</p>
                    <p className="text-xs text-[var(--c-text-muted)] mt-0.5 leading-relaxed">{opt.desc}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={goBack}
          disabled={current === 0}
          className="text-sm text-[var(--c-text-muted)] hover:text-[var(--c-text)] disabled:opacity-0 transition-colors"
        >
          ← Back
        </button>
        <button
          onClick={goNext}
          disabled={!selected || submitting}
          className="bg-[var(--c-primary)] text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-40"
        >
          {submitting ? 'Finding roles…' : current === total - 1 ? 'See my recommendations →' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

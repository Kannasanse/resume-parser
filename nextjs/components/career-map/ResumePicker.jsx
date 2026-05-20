'use client';
import { useState } from 'react';
import ResumePickerCard from './ResumePickerCard';
import NoResumeEmptyState from './NoResumeEmptyState';

export default function ResumePicker({ resumes, lastUsedResumeId, onSelect, onSkip }) {
  const [selected, setSelected] = useState(lastUsedResumeId || null);
  const [loading, setLoading] = useState(false);

  if (!resumes || resumes.length === 0) {
    return <NoResumeEmptyState onSkip={onSkip} />;
  }

  async function handleAnalyse() {
    if (!selected) return;
    setLoading(true);
    await onSelect(selected);
  }

  return (
    <div className="max-w-[720px] mx-auto animate-fade-in-scale">
      <div className="space-y-1">
        <h2 className="text-[22px] font-bold text-[#2C2C2A]">Which resume should we analyse?</h2>
        <p className="text-[15px]" style={{ color: '#6B7280' }}>
          Choose the resume that best represents the career path you want to explore.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mt-8">
        {resumes.map(resume => (
          <ResumePickerCard
            key={resume.id}
            resume={resume}
            selected={selected}
            onSelect={setSelected}
          />
        ))}
      </div>

      <div className="mt-8 space-y-3">
        <button
          onClick={handleAnalyse}
          disabled={!selected || loading}
          className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-colors disabled:opacity-40"
          style={{ background: '#185FA5' }}
        >
          {loading ? 'Analysing resume…' : 'Analyse this resume →'}
        </button>
        <p className="text-center text-[14px]" style={{ color: '#6B7280' }}>
          Don't see the right one?{' '}
          <a href="/builder" target="_blank" rel="noopener noreferrer"
            className="font-medium hover:underline" style={{ color: '#185FA5' }}>
            Go to Resume Builder →
          </a>
        </p>
      </div>
    </div>
  );
}

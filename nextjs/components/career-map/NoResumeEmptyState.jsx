'use client';
import { useRouter } from 'next/navigation';

export default function NoResumeEmptyState({ onSkip }) {
  const router = useRouter();

  return (
    <div className="max-w-[480px] mx-auto text-center space-y-5 py-8">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#D1DCE8"
        strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
        <polyline points="10 9 9 9 8 9"/>
      </svg>

      <div className="space-y-2">
        <h2 className="text-[18px] font-semibold text-[#2C2C2A]">
          You don't have a published resume yet
        </h2>
        <p className="text-[14px] leading-relaxed" style={{ color: '#6B7280' }}>
          The Career Map analyses your resume to understand your background and recommend
          career paths. Create and publish a resume first to get started.
        </p>
      </div>

      <div className="space-y-3 pt-2">
        <button
          onClick={() => router.push('/builder')}
          className="w-full py-3 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ background: '#185FA5' }}
        >
          Build my resume →
        </button>
        {onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="text-[14px] transition-colors"
            style={{ color: '#9CA3AF' }}
          >
            I'll do this later
          </button>
        )}
      </div>
    </div>
  );
}

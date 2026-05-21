'use client';

export default function SkillGapDrawer({ data, onClose, onViewRoadmap }) {
  const { target_role_title, required_skills, matched_skills, missing_skills, match_percent } = data;

  return (
    <div className="absolute top-0 right-0 h-full w-80 bg-white dark:bg-[#111F35] border-l border-[var(--c-border)] shadow-xl flex flex-col z-10">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--c-border)]">
        <div>
          <p className="text-sm font-semibold text-[var(--c-text)]">Skill Gap</p>
          <p className="text-xs text-[var(--c-text-muted)] mt-0.5">{target_role_title}</p>
        </div>
        <button onClick={onClose} className="text-[var(--c-text-muted)] hover:text-[var(--c-text)]">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12"/>
          </svg>
        </button>
      </div>

      {/* Match meter */}
      <div className="px-5 py-4 border-b border-[var(--c-border)]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--c-text)]">Overall match</span>
          <span className="text-lg font-bold text-[var(--c-primary)]">{match_percent}%</span>
        </div>
        <div className="h-2.5 bg-gray-100 dark:bg-[rgba(255,255,255,0.10)] rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${match_percent}%`,
              background: match_percent >= 70 ? 'var(--c-success)' : match_percent >= 40 ? '#F59E0B' : '#EF4444',
            }}
          />
        </div>
        <p className="text-xs text-[var(--c-text-muted)] mt-1">
          {matched_skills?.length || 0} of {required_skills?.length || 0} required skills
        </p>
      </div>

      {/* Skills */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {missing_skills?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-red-600 uppercase tracking-wide mb-2">Missing skills</p>
            <div className="flex flex-wrap gap-1.5">
              {missing_skills.map(s => (
                <span key={s} className="text-xs bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}

        {matched_skills?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-[var(--c-success)] uppercase tracking-wide mb-2">Skills you have</p>
            <div className="flex flex-wrap gap-1.5">
              {matched_skills.map(s => (
                <span key={s} className="text-xs bg-[var(--c-success-bg)] text-[var(--c-success)] px-2 py-0.5 rounded-full">{s}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="px-5 py-4 border-t border-[var(--c-border)]">
        <button
          onClick={() => onViewRoadmap(data.target_role_id)}
          className="w-full bg-[var(--c-primary)] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[var(--c-primary-dark)] transition-colors"
        >
          View Learning Roadmap →
        </button>
      </div>
    </div>
  );
}

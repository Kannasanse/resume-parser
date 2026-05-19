'use client';

export default function SectionNavSidebar({ sections, completedSectionIds, activeIndex, onSelectSection, pct, completedCount, totalSections }) {
  return (
    <div className="w-60 flex-shrink-0 bg-white border-r border-[var(--c-border)] overflow-y-auto flex flex-col hidden md:flex">
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wider">Contents</p>
      </div>

      <div className="flex-1 px-2 space-y-0.5">
        {sections.map((section, idx) => {
          const isCompleted = completedSectionIds.has(section.id);
          const isActive = idx === activeIndex;
          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(idx)}
              className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive ? 'bg-[var(--c-primary-light)] text-[var(--c-primary)]' :
                isCompleted ? 'text-[var(--c-success)]' : 'text-[var(--c-text-muted)] hover:bg-gray-50'
              }`}
            >
              <div className={`w-4 h-4 mt-0.5 rounded border flex-shrink-0 flex items-center justify-center ${
                isCompleted ? 'bg-[var(--c-success)] border-[var(--c-success)]' : 'border-current'
              }`}>
                {isCompleted && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-xs font-mono text-[var(--c-text-muted)] mr-1">
                  {String(idx + 1).padStart(2, '0')}
                </span>
                <span className={`text-xs leading-snug ${isActive ? 'font-semibold' : ''} ${isCompleted ? 'line-through opacity-70' : ''}`}>
                  {section.heading}
                </span>
                <span className="block text-xs text-[var(--c-text-muted)] mt-0.5">~{section.estimatedReadMinutes || 5} min</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Progress */}
      <div className="px-4 py-4 border-t border-[var(--c-border)]">
        <div className="h-1.5 bg-[var(--c-primary-light)] rounded-full overflow-hidden mb-1.5">
          <div className="h-full bg-[var(--c-primary)] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-[var(--c-text-muted)]">{completedCount} of {totalSections} sections completed</p>
      </div>
    </div>
  );
}

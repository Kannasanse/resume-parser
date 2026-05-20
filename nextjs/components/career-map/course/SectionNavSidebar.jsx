'use client';

export default function SectionNavSidebar({ sections, completedSectionIds, activeIndex, onSelectSection, pct, completedCount, totalSections }) {
  return (
    <div className="w-60 flex-shrink-0 glass-light border-r border-[var(--c-border)] overflow-y-auto flex flex-col hidden md:flex">
      <div className="px-4 pt-5 pb-3">
        <p className="text-xs font-semibold text-[var(--c-text-muted)] uppercase tracking-wider">Contents</p>
      </div>

      <div className="flex-1 px-2 space-y-0.5">
        {sections.map((section, idx) => {
          const isCompleted = completedSectionIds.has(section.id);
          const isActive = idx === activeIndex;
          const type = section.type || 'text';
          const SectionIcon = () => {
            if (isCompleted) return (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
            );
            if (type === 'video-only') return (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D93025" strokeWidth="1.75"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16"/></svg>
            );
            return (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            );
          };
          return (
            <button
              key={section.id}
              onClick={() => onSelectSection(idx)}
              className={`w-full flex items-start gap-2 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive ? 'bg-[rgba(24,95,165,0.08)] border-l-[3px] border-[var(--c-primary)] text-[var(--c-primary)]' :
                isCompleted ? 'text-[var(--c-success)]' : 'text-[var(--c-text-muted)] hover:bg-gray-50'
              }`}
            >
              <div className="w-4 h-4 mt-0.5 flex-shrink-0 flex items-center justify-center">
                <SectionIcon />
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
          <div className="h-full bg-gradient-to-r from-[#185FA5] to-[#1D9E75] rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-[var(--c-text-muted)]">{completedCount} of {totalSections} sections completed</p>
      </div>
    </div>
  );
}

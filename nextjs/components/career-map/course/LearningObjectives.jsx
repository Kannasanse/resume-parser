export default function LearningObjectives({ objectives = [] }) {
  if (!objectives || objectives.length === 0) return null;
  return (
    <div className="rounded-xl border border-[#D1DCE8] dark:border-white/10 bg-[#F4F8FC] dark:bg-[#0D1830] p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)]">Learning objectives</p>
      <ul className="space-y-1.5">
        {objectives.map((obj, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-[var(--c-text)]">
            <svg className="flex-shrink-0 mt-0.5 text-[var(--c-primary)]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span>{obj}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

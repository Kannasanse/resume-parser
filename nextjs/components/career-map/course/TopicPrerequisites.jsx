export default function TopicPrerequisites({ prerequisites = [] }) {
  if (!prerequisites || prerequisites.length === 0) return null;
  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-900/10 p-4 space-y-2">
      <p className="text-xs font-semibold uppercase tracking-widest text-amber-700 dark:text-amber-400">Prerequisites</p>
      <p className="text-xs text-amber-700 dark:text-amber-400">Complete these topics first for the best learning experience:</p>
      <ul className="space-y-1">
        {prerequisites.map((prereq, i) => (
          <li key={i} className="flex items-center gap-2 text-sm text-amber-800 dark:text-amber-300 font-medium">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18 15 12 9 6"/>
            </svg>
            {prereq}
          </li>
        ))}
      </ul>
    </div>
  );
}

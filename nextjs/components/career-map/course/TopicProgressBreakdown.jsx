const TYPE_LABELS = { concept: 'Concepts', practical: 'Practicals', exercise: 'Exercises', video: 'Videos', summary: 'Summary' };
const TYPE_COLORS = {
  concept:   'bg-blue-500',
  practical: 'bg-violet-500',
  exercise:  'bg-amber-500',
  video:     'bg-red-500',
  summary:   'bg-green-500',
};

export default function TopicProgressBreakdown({ sections = [], completedSectionIds }) {
  const completed = completedSectionIds instanceof Set ? completedSectionIds : new Set(completedSectionIds || []);

  const byType = {};
  for (const s of sections) {
    const t = s.section_type || 'concept';
    if (!byType[t]) byType[t] = { total: 0, done: 0 };
    byType[t].total++;
    if (completed.has(s.id)) byType[t].done++;
  }

  const entries = Object.entries(byType).filter(([, v]) => v.total > 0);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-xl border border-[var(--c-border)] bg-[var(--c-surface)] p-4 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--c-text-muted)]">Progress by type</p>
      <div className="space-y-2">
        {entries.map(([type, { total, done }]) => (
          <div key={type} className="flex items-center gap-3">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${TYPE_COLORS[type] || 'bg-gray-400'}`} />
            <span className="text-xs text-[var(--c-text-muted)] w-20 flex-shrink-0">{TYPE_LABELS[type] || type}</span>
            <div className="flex-1 h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${TYPE_COLORS[type] || 'bg-gray-400'}`}
                style={{ width: total > 0 ? `${(done / total) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-xs text-[var(--c-text-muted)] flex-shrink-0 w-10 text-right">{done}/{total}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

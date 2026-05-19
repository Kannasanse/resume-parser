export default function CourseStatsBar({ stats }) {
  const items = [
    { icon: '📚', value: stats.total, label: 'Total courses' },
    { icon: '⚡', value: stats.inProgress, label: 'In progress' },
    { icon: '✅', value: stats.completed, label: 'Completed' },
    { icon: '⏱', value: `${stats.hoursStudied}h`, label: 'Hours studied' },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-2 bg-[#F4F8FC] border border-[var(--c-border)] rounded-lg px-4 py-3">
          <span>{item.icon}</span>
          <span className="text-sm font-semibold text-[var(--c-text)]">{item.value}</span>
          <span className="text-xs text-[var(--c-text-muted)]">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

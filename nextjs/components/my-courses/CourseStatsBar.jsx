export default function CourseStatsBar({ stats }) {
  const items = [
    { icon: '📚', value: stats.total, label: 'Total courses', iconBg: 'bg-gradient-to-br from-[#E6F1FB] to-[#D4E8F8]' },
    { icon: '⚡', value: stats.inProgress, label: 'In progress', iconBg: 'bg-gradient-to-br from-[#FEF3C7] to-[#FDE68A]' },
    { icon: '✅', value: stats.completed, label: 'Completed', iconBg: 'bg-gradient-to-br from-[#D1FAE5] to-[#BBF7D0]' },
    { icon: '⏱', value: `${stats.hoursStudied}h`, label: 'Hours studied', iconBg: 'bg-gradient-to-br from-[#E6F1FB] to-[#D4E8F8]' },
  ];

  return (
    <div className="flex flex-wrap gap-3">
      {items.map(item => (
        <div key={item.label} className="card shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${item.iconBg}`}>
            {item.icon}
          </div>
          <div>
            <div className="text-2xl font-extrabold tracking-[-0.03em] text-[var(--c-text)]">{item.value}</div>
            <div className="text-xs text-[var(--c-text-muted)]">{item.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

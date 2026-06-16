const TYPE_CONFIG = {
  concept:   { label: 'Concept',   bg: 'bg-blue-50 dark:bg-blue-900/20',   text: 'text-blue-600 dark:text-blue-400',   dot: 'bg-blue-500' },
  practical: { label: 'Practical', bg: 'bg-violet-50 dark:bg-violet-900/20', text: 'text-violet-600 dark:text-violet-400', dot: 'bg-violet-500' },
  exercise:  { label: 'Exercise',  bg: 'bg-amber-50 dark:bg-amber-900/20',  text: 'text-amber-600 dark:text-amber-400',  dot: 'bg-amber-500' },
  video:     { label: 'Video',     bg: 'bg-red-50 dark:bg-red-900/20',      text: 'text-red-600 dark:text-red-400',      dot: 'bg-red-500' },
  summary:   { label: 'Summary',   bg: 'bg-green-50 dark:bg-green-900/20',  text: 'text-green-700 dark:text-green-400',  dot: 'bg-green-500' },
};

export default function SectionTypeBadge({ sectionType }) {
  const cfg = TYPE_CONFIG[sectionType];
  if (!cfg) return null;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
}

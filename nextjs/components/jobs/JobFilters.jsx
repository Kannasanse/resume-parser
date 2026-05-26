'use client';

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'FULLTIME', label: 'Full-time' },
  { value: 'PARTTIME', label: 'Part-time' },
  { value: 'CONTRACT', label: 'Contract' },
  { value: 'INTERN', label: 'Internship' },
];

const DATE_OPTIONS = [
  { value: '', label: 'Any time' },
  { value: 'week', label: 'Past week' },
  { value: 'month', label: 'Past month' },
];

export default function JobFilters({ filters = {}, onChange }) {
  const set = (key, value) => onChange?.({ ...filters, [key]: value });

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Employment type pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {TYPE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => set('type', opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              (filters.type ?? '') === opt.value
                ? 'bg-[#185FA5] text-white'
                : 'bg-white dark:bg-white/5 border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:border-[#185FA5] hover:text-[#185FA5]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div className="w-px h-4 bg-[#D1DCE8] dark:bg-white/10 hidden sm:block" />

      {/* Date posted pills */}
      <div className="flex items-center gap-1 flex-wrap">
        {DATE_OPTIONS.map(opt => (
          <button
            key={opt.value}
            type="button"
            onClick={() => set('date', opt.value)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              (filters.date ?? '') === opt.value
                ? 'bg-[#185FA5] text-white'
                : 'bg-white dark:bg-white/5 border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:border-[#185FA5] hover:text-[#185FA5]'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

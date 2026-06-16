import GeneratedContent from './GeneratedContent';

export default function TopicSummary({ section, onRegenerate }) {
  if (!section.is_generated || !section.content) return null;
  return (
    <div className="rounded-xl border border-[#1D9E75]/30 overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#1D9E75]/30 bg-[#F0FDF4] dark:bg-[rgba(29,158,117,0.08)]">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="m9 12 2 2 4-4"/><circle cx="12" cy="12" r="9"/>
        </svg>
        <span className="text-xs font-semibold text-[#1D9E75] uppercase tracking-widest">Topic summary</span>
      </div>
      <div className="p-4 bg-white dark:bg-[#111F35]">
        <GeneratedContent section={section} onRegenerate={onRegenerate} hideActions />
      </div>
    </div>
  );
}

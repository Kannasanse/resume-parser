export default function DifficultyNote({ note }) {
  if (!note) return null;
  return (
    <div className="flex items-start gap-2 text-xs text-[#6B7280] dark:text-[#8BA3C1] italic">
      <svg className="flex-shrink-0 mt-0.5" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{note}</span>
    </div>
  );
}

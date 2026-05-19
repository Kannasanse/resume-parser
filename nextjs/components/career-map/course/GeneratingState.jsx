export default function GeneratingState() {
  return (
    <div className="bg-[#F4F8FC] border border-dashed border-[var(--c-border)] rounded-xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <svg className="animate-spin text-[var(--c-primary)]" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
        </svg>
        <span className="text-sm text-[var(--c-primary)]">Generating content…</span>
      </div>
      <div className="space-y-2">
        {[90, 75, 82, 60].map((w, i) => (
          <div key={i} className="h-3.5 bg-[var(--c-primary-light)] rounded animate-pulse" style={{ width: `${w}%` }} />
        ))}
      </div>
      <p className="text-xs text-gray-400 text-center">This usually takes 5–10 seconds</p>
    </div>
  );
}

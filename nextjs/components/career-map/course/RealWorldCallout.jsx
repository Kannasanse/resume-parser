export default function RealWorldCallout({ text }) {
  if (!text) return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-[#1D9E75]/30 bg-[#F0FDF4] dark:bg-[rgba(29,158,117,0.08)] p-4">
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#1D9E75]/15 flex items-center justify-center">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1D9E75" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
          <circle cx="12" cy="10" r="3"/>
        </svg>
      </div>
      <div>
        <p className="text-xs font-semibold text-[#1D9E75] uppercase tracking-widest mb-1">Real-world use</p>
        <p className="text-sm text-[#2C2C2A] dark:text-[#E8EFF7]">{text}</p>
      </div>
    </div>
  );
}

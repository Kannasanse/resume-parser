'use client';

export default function PlaceholderState({ estimatedMinutes, onGenerate }) {
  return (
    <div className="p-6 text-center min-h-32" style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(135deg, #185FA5, #1D9E75) border-box', border: '2px dashed transparent', borderRadius: '16px' }}>
      <svg className="mx-auto mb-3 animate-float" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5">
        <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9-4.03-9-9-9zm0 0"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
      </svg>
      <p className="text-sm text-[var(--c-text-muted)]">Content for this section hasn't been generated yet.</p>
      <p className="text-xs text-gray-400 mt-1">~{estimatedMinutes || 5} min read when generated</p>
      <button
        onClick={onGenerate}
        className="btn-primary mt-4 text-sm font-medium px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        Generate content
      </button>
    </div>
  );
}

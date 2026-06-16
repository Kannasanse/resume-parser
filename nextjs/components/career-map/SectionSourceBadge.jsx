'use client';

export default function SectionSourceBadge({ sourceType, sourceDomain, sourceUrl, sourceTitle }) {
  if (!sourceType || sourceType === 'ai') return null;

  const isWeb = sourceType === 'web';
  const isFallback = sourceType === 'ai_fallback';

  if (isFallback) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--c-text-muted)] mb-3">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/>
          <path d="M2 17l10 5 10-5"/>
          <path d="M2 12l10 5 10-5"/>
        </svg>
        <span>AI generated</span>
        <span className="text-[var(--c-border)]">·</span>
        <span className="text-amber-600 dark:text-amber-400">web search unavailable</span>
      </div>
    );
  }

  if (isWeb) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-[var(--c-text-muted)] mb-3">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <span>Sourced from</span>
        {sourceUrl ? (
          <a
            href={sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-[#185FA5] dark:text-[#5B9FD4] hover:underline"
          >
            {sourceDomain || sourceTitle || 'web'}
          </a>
        ) : (
          <span className="font-medium">{sourceDomain || 'web'}</span>
        )}
        <span className="text-[var(--c-border)]">·</span>
        <span>summarised by AI</span>
      </div>
    );
  }

  return null;
}

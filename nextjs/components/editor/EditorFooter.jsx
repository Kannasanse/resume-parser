'use client';

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-[#1D9E75] dark:text-[#34C68A]"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      className="animate-spin text-[#185FA5] dark:text-[#5B9FD4]"
    >
      <path d="M21 12a9 9 0 1 1-6.22-8.56" />
    </svg>
  );
}

export default function EditorFooter({ wordCount = 0, saveState = 'idle', onRetrySave }) {
  return (
    <div className="flex items-center justify-between px-4 py-2 border-t border-[#D1DCE8] dark:border-white/10 text-xs text-[#9CA3AF] dark:text-[#4A6380] select-none">
      <span>
        {wordCount} {wordCount === 1 ? 'word' : 'words'}
      </span>

      <div className="flex items-center gap-1.5">
        {saveState === 'saving' && (
          <>
            <LoadingSpinner />
            <span>Saving…</span>
          </>
        )}

        {saveState === 'saved' && (
          <>
            <CheckIcon />
            <span className="text-[#1D9E75] dark:text-[#34C68A]">Saved</span>
          </>
        )}

        {saveState === 'error' && (
          <>
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-red-500"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <span className="text-red-500">Failed to save</span>
            {onRetrySave && (
              <button
                onClick={onRetrySave}
                className="text-[#185FA5] dark:text-[#5B9FD4] underline ml-1 hover:no-underline transition-all"
              >
                Retry
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}

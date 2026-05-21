import Link from 'next/link';

const FILTER_MESSAGES = {
  in_progress: 'Start a study plan from your Career Map to see it here.',
  completed: 'Complete a course to see it here. Keep going!',
  paused: "You haven't paused any courses.",
  not_started: 'All your plans have been started. Great work!',
};

export default function EmptyState({ tab, hasAnyCourses, onNewCourse }) {
  if (!hasAnyCourses) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--ds-border, #D1DCE8)" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
        <h3 className="text-xl font-semibold text-[var(--c-text)]">No courses yet</h3>
        <p className="text-sm text-[var(--c-text-muted)] max-w-sm">
          Create a course from skills you want to learn, or generate one from your Career Map.
        </p>
        <div className="flex items-center gap-3 mt-2">
          {onNewCourse && (
            <button
              onClick={onNewCourse}
              className="bg-[var(--c-primary)] text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:opacity-90 transition-opacity"
            >
              Create a course
            </button>
          )}
          <Link
            href="/career-map"
            className="border border-[var(--c-border)] text-sm font-medium px-5 py-2.5 rounded-lg text-[var(--c-text-muted)] hover:text-[var(--c-text)] transition-colors"
          >
            Go to Career Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--ds-border, #D1DCE8)" strokeWidth="1.5">
        <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
      </svg>
      <p className="text-sm font-semibold text-[var(--c-text-muted)]">No {tab.replace('_', ' ')} courses</p>
      <p className="text-xs text-[var(--c-text-muted)]">{FILTER_MESSAGES[tab] || 'No courses match this filter.'}</p>
    </div>
  );
}

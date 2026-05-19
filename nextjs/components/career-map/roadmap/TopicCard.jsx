'use client';
import Link from 'next/link';

const STATUS_STYLES = {
  not_started: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-[var(--c-success-bg)] text-[var(--c-success)]',
};
const STATUS_LABELS = { not_started: 'Not started', in_progress: 'In progress', completed: 'Completed' };

export default function TopicCard({ topic, studyPlanId }) {
  const status = topic.status || 'not_started';
  const videoCount = (topic.youtube_videos || []).length;
  const sectionCount = (topic.sections || []).length;
  const pct = topic.completion_pct || 0;
  const isCompleted = topic.is_completed;

  const ctaLabel = isCompleted ? 'Review →' : pct > 0 ? 'Continue →' : 'Start learning →';

  return (
    <div className={`rounded-xl border p-5 transition-all duration-200 hover:shadow-md cursor-pointer group ${
      isCompleted ? 'border-[var(--c-success)] bg-green-50/50' : 'border-[var(--c-border)] bg-white hover:border-[var(--c-primary)]'
    }`}>
      {/* Top row */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs bg-[var(--c-primary-light)] text-[var(--c-primary)] px-2 py-0.5 rounded-full font-medium">
          {topic.skill}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${STATUS_STYLES[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      <h4 className="text-sm font-semibold text-[var(--c-text)] mb-1 line-clamp-2">{topic.title}</h4>
      {topic.description && (
        <p className="text-xs text-[var(--c-text-muted)] line-clamp-2">{topic.description}</p>
      )}

      <div className="border-t border-[var(--c-border)] my-3" />

      <div className="flex items-center gap-4 text-xs text-[var(--c-text-muted)]">
        <span>⏱ {topic.estimated_hours}h</span>
        <span>📖 {sectionCount} sections</span>
        {videoCount > 0 && <span>🎬 {videoCount} videos</span>}
      </div>

      {pct > 0 && (
        <div className="mt-3">
          <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-[var(--c-primary)] rounded-full" style={{ width: `${pct}%` }} />
          </div>
          <p className="text-xs text-[var(--c-text-muted)] mt-1 text-right">{pct}% read</p>
        </div>
      )}

      <Link
        href={`/career-map/study-plan/${studyPlanId}/topic/${topic.id}`}
        className="mt-3 block text-xs font-medium text-[var(--c-primary)] group-hover:underline"
      >
        {ctaLabel}
      </Link>
    </div>
  );
}

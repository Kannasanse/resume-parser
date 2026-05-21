import { useState, useEffect } from 'react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import CourseCardMenu from './CourseCardMenu';
import PreferenceModal from '../career-map/roadmap/PreferenceModal';

const STATUS_GRADIENT = {
  active_progress: 'linear-gradient(135deg, #185FA5, #0C447C)',
  active_empty:    'linear-gradient(135deg, #6B7280, #9CA3AF)',
  completed:       'linear-gradient(135deg, #1D9E75, #15803D)',
  paused:          'linear-gradient(135deg, #6B7280, #9CA3AF)',
};

const STATUS_CHIP = {
  active_progress: { label: 'In Progress', bg: 'bg-blue-100 text-blue-700' },
  active_empty:    { label: 'Not Started',  bg: 'bg-gray-100 text-gray-600' },
  completed:       { label: 'Completed',    bg: 'bg-green-100 text-green-700' },
  paused:          { label: 'Paused',       bg: 'bg-amber-100 text-amber-700' },
};

function getCardVariant(course) {
  if (course.status === 'completed') return 'completed';
  if (course.status === 'paused') return 'paused';
  if (course.overallPercent > 0) return 'active_progress';
  return 'active_empty';
}

function resumeHref(course) {
  if (course.resumeTopicId && course.resumeSectionId) {
    return `/career-map/study-plan/${course.id}/topic/${course.resumeTopicId}?section=${course.resumeSectionId}`;
  }
  if (course.resumeTopicId) {
    return `/career-map/study-plan/${course.id}/topic/${course.resumeTopicId}`;
  }
  return `/career-map/study-plan/${course.id}`;
}

export default function CourseCard({ course, onStatusChange, onDelete, onResetProgress }) {
  const [prefModalOpen, setPrefModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (!successMsg) return;
    const t = setTimeout(() => setSuccessMsg(''), 4000);
    return () => clearTimeout(t);
  }, [successMsg]);

  const variant = getCardVariant(course);
  const chip = STATUS_CHIP[variant];
  const gradient = STATUS_GRADIENT[variant];

  const phasesTotal = course.phases?.length ?? 0;
  const phasesCompleted = course.phases?.filter(p => p.status === 'completed').length ?? 0;

  return (
    <div className="card card-interactive overflow-hidden flex flex-col">
      {/* Header */}
      <div className="relative h-[100px] flex flex-col justify-end px-4 pb-3" style={{ background: gradient }}>
        {/* Menu */}
        <div className="absolute top-3 right-3">
          <CourseCardMenu
            course={course}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
            onResetProgress={onResetProgress}
            onAdjustPreferences={() => setPrefModalOpen(true)}
          />
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-medium text-white/80">Overall Progress</span>
            <span className="text-[11px] font-bold text-white">{course.overallPercent}%</span>
          </div>
          <div className="h-1.5 bg-white/25 rounded-full overflow-hidden">
            <div
              className="h-full bg-white rounded-full transition-all"
              style={{ width: `${course.overallPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 px-4 pt-3 pb-4 space-y-3">
        {/* Title + chip */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-[var(--c-text)] leading-snug line-clamp-2">
              {course.targetRoleTitle}
            </h3>
            {course.creationMode === 'skills' && (
              <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-medium text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                Skills Course
              </span>
            )}
          </div>
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap flex-shrink-0 ${
            variant === 'active_progress' ? 'chip-primary' :
            variant === 'completed' ? 'chip-success' :
            variant === 'paused' ? 'chip-warning' :
            chip.bg
          }`}>
            {chip.label}
          </span>
        </div>

        {/* Phase chips */}
        {phasesTotal > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {course.phases?.slice(0, 4).map((phase, i) => (
              <span
                key={i}
                className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                  phase.status === 'completed'
                    ? 'chip-success'
                    : phase.status === 'in_progress'
                    ? 'chip-primary'
                    : 'bg-gray-50 border-gray-200 text-gray-500'
                }`}
              >
                {phase.label}
              </span>
            ))}
            {phasesTotal > 4 && (
              <span className="text-[10px] px-2 py-0.5 rounded-full border bg-gray-50 border-gray-200 text-gray-500">
                +{phasesTotal - 4} more
              </span>
            )}
          </div>
        )}

        {/* Stats row */}
        <div className="flex items-center gap-4 text-xs text-[var(--c-text-muted)]">
          <span className="flex items-center gap-1">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
            {course.completedSections ?? 0} sections done
          </span>
          {phasesTotal > 0 && (
            <span className="flex items-center gap-1">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
              {phasesCompleted}/{phasesTotal} phases
            </span>
          )}
          {course.lastStudiedAt && (
            <span className="ml-auto flex items-center gap-1 flex-shrink-0">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {formatDistanceToNow(new Date(course.lastStudiedAt), { addSuffix: true })}
            </span>
          )}
        </div>

        {/* Action row */}
        <div className="flex items-center justify-between pt-1 mt-auto group">
          <Link
            href={resumeHref(course)}
            className="text-sm font-medium text-[var(--c-primary)] hover:underline"
          >
            {variant === 'active_empty' ? 'Start learning ' : variant === 'completed' ? 'Review ' : 'Continue learning '}
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </Link>
          <Link
            href={`/career-map/study-plan/${course.id}`}
            className="text-xs text-[var(--c-text-muted)] hover:text-[var(--c-text)] border border-[var(--c-border)] px-2.5 py-1 rounded-lg transition-colors"
          >
            View plan
          </Link>
        </div>
      </div>

      {successMsg && (
        <div className="px-4 py-2 bg-green-50 border-t border-green-200 text-xs text-green-700 font-medium">
          {successMsg}
        </div>
      )}

      <PreferenceModal
        open={prefModalOpen}
        onClose={() => setPrefModalOpen(false)}
        existingPlan={{
          id: course.id,
          preferences: course.preferences,
          totalHours: course.totalHours,
          totalWeeks: course.estimatedWeeks,
          targetRoleTitle: course.targetRoleTitle,
        }}
        onPlanUpdated={msg => { setSuccessMsg(msg); onResetProgress(course.id); }}
      />
    </div>
  );
}

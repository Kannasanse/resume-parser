'use client';
import { formatEmploymentType, formatRelativeDate, formatSalary } from '@/lib/jobs/formatters.js';

function XIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}
function MapPinIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}
function BookmarkIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

export default function JobCard({ job, onApply, onSave, onDismiss }) {
  const salary = formatSalary(job.salary_min, job.salary_max, job.salary_currency, job.salary_period);

  return (
    <div className="bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-2xl p-5 flex flex-col gap-4 hover:border-[rgba(24,95,165,0.35)] hover:-translate-y-0.5 hover:shadow-md transition-all duration-200">

      {/* Header */}
      <div className="flex items-start gap-3">
        {job.company_logo ? (
          <img
            src={job.company_logo}
            alt={job.company}
            className="w-10 h-10 rounded-xl object-contain border border-[#D1DCE8] dark:border-white/10 flex-shrink-0 bg-white"
          />
        ) : (
          <div className="w-10 h-10 rounded-xl flex-shrink-0 bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.18)] flex items-center justify-center text-[#185FA5] font-bold text-sm">
            {job.company?.[0]?.toUpperCase() ?? '?'}
          </div>
        )}

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] line-clamp-1">
            {job.title}
          </h3>
          <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] mt-0.5 truncate">{job.company}</p>
        </div>

        <button
          type="button"
          onClick={() => onDismiss?.(job.job_id)}
          className="text-[#D1DCE8] hover:text-[#9CA3AF] dark:text-white/20 dark:hover:text-white/50 transition-colors flex-shrink-0 mt-0.5"
          title="Not interested"
        >
          <XIcon />
        </button>
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="inline-flex items-center gap-1 text-xs text-[#6B7280] dark:text-[#8BA3C1]">
          <MapPinIcon />
          {job.is_remote ? 'Remote' : (job.city || job.location || '—')}
        </span>

        <span className="inline-flex items-center text-xs bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.15)] text-[#185FA5] dark:text-[#5B9FD4] border border-[rgba(24,95,165,0.20)] rounded-full px-2 py-0.5 font-medium">
          {formatEmploymentType(job.employment_type)}
        </span>

        <span className="text-xs text-[#9CA3AF]">via {job.source}</span>

        <span className="text-xs text-[#9CA3AF] ml-auto">{formatRelativeDate(job.posted_at)}</span>
      </div>

      {/* Description snippet */}
      <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1] line-clamp-2 leading-relaxed">
        {job.description}
      </p>

      {/* Salary */}
      {salary && (
        <p className="text-xs font-semibold text-[#1D9E75] dark:text-[#34C68A]">{salary}</p>
      )}

      {/* Action row */}
      <div className="flex items-center gap-2 pt-1 border-t border-[#D1DCE8] dark:border-white/8">
        <a
          href={job.apply_link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => onApply?.(job)}
          className="flex-1 text-center text-sm font-semibold py-2 px-4 bg-[#185FA5] text-white rounded-[10px] hover:bg-[#0C447C] transition-colors"
        >
          Apply →
        </a>
        <button
          type="button"
          onClick={() => onSave?.(job.job_id)}
          className="p-2 rounded-[10px] border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] hover:border-[#185FA5] hover:text-[#185FA5] transition-colors"
          title="Save job"
        >
          <BookmarkIcon />
        </button>
      </div>

      {/* Extra apply sources */}
      {job.apply_options?.length > 1 && (
        <p className="text-xs text-[#9CA3AF] text-center -mt-2">
          Also on: {job.apply_options.slice(1, 3).map(o => o.publisher).join(', ')}
        </p>
      )}
    </div>
  );
}

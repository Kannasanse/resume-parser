'use client';
import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { getJobs, deleteJob } from '@/lib/api';
import HoldToDelete from '@/components/HoldToDelete';

const PROFICIENCY_COLORS = {
  Expert:        'bg-purple-50 text-purple-700',
  Advanced:      'bg-secondary-light text-secondary',
  Intermediate:  'bg-ds-successLight text-ds-success',
  Beginner:      'bg-ds-warningLight text-ds-warning',
  'Nice-to-have':'bg-ds-bg text-ds-textMuted',
};

const PAGE_SIZE_OPTIONS = [50, 100, 150, 200];

function DeleteConfirmModal({ jobTitle, onCancel, onDelete }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} />
      <div className="relative bg-ds-card rounded-lg border border-ds-border shadow-xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-ds-dangerLight flex items-center justify-center flex-shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ds-danger">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div>
            <h2 className="font-heading font-bold text-ds-text text-base">Delete Job Profile?</h2>
            <p className="text-sm text-ds-textSecondary mt-1 leading-relaxed">
              <span className="font-medium">{jobTitle}</span> and all associated candidate scores will be permanently removed.
            </p>
          </div>
        </div>
        <div className="bg-ds-dangerLight rounded px-4 py-3">
          <p className="text-xs text-ds-danger font-medium">This action cannot be undone.</p>
        </div>
        <div className="flex flex-col gap-2 pt-1">
          <HoldToDelete onDelete={onDelete} />
          <button onClick={onCancel}
            className="w-full px-5 py-2.5 text-sm font-medium text-ds-textMuted border border-ds-border rounded-btn hover:bg-ds-bg transition-colors">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

function Pagination({ page, totalPages, total, pageSize, onPage, onPageSize }) {
  const start = (page - 1) * pageSize + 1;
  const end   = Math.min(page * pageSize, total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4 px-1">
      <p className="text-xs text-ds-textMuted">
        Showing {start}–{end} of {total}
      </p>
      <div className="flex items-center gap-2">
        <select
          value={pageSize}
          onChange={e => onPageSize(Number(e.target.value))}
          className="text-xs border border-ds-inputBorder rounded px-2 py-1.5 bg-ds-card text-ds-text focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {PAGE_SIZE_OPTIONS.map(n => <option key={n} value={n}>{n} per page</option>)}
        </select>
        <button
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors"
        >
          ← Prev
        </button>
        <span className="text-xs text-ds-textMuted font-mono">{page} / {totalPages}</span>
        <button
          disabled={page >= totalPages}
          onClick={() => onPage(page + 1)}
          className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default function JobProfiles() {
  const queryClient = useQueryClient();
  const { data: jobs = [], isLoading, error } = useQuery({ queryKey: ['jobs'], queryFn: getJobs });
  const [deletingJob, setDeletingJob] = useState(null);
  const [search, setSearch]       = useState('');
  const [page, setPage]           = useState(1);
  const [pageSize, setPageSize]   = useState(50);

  useEffect(() => { setPage(1); }, [search]);

  const handleDeleteConfirmed = async () => {
    await deleteJob(deletingJob.id);
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    setDeletingJob(null);
  };

  if (isLoading) return <p className="text-ds-textMuted">Loading job profiles...</p>;
  if (error)     return <p className="text-ds-danger">Failed to load job profiles.</p>;

  const filteredJobs = jobs.filter(j =>
    !search || j.title.toLowerCase().includes(search.toLowerCase())
  );
  const totalPages   = Math.max(1, Math.ceil(filteredJobs.length / pageSize));
  const effectivePage = Math.min(page, totalPages);
  const paginatedJobs = filteredJobs.slice((effectivePage - 1) * pageSize, effectivePage * pageSize);

  return (
    <div>
      {deletingJob && (
        <DeleteConfirmModal
          jobTitle={deletingJob.title}
          onCancel={() => setDeletingJob(null)}
          onDelete={handleDeleteConfirmed}
        />
      )}

      <div className="flex items-center justify-between mb-4">
        <h1 className="font-heading text-2xl font-bold text-ds-text">
          Job Profiles{' '}
          <span className="text-ds-textMuted font-normal text-lg">
            ({search ? `${filteredJobs.length} of ${jobs.length}` : jobs.length})
          </span>
        </h1>
        <Link href="/jobs/new"
          className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark transition-colors">
          + New Profile
        </Link>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-textMuted pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search job profiles…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ds-textMuted hover:text-ds-text text-lg leading-none"
            >×</button>
          )}
        </div>
      </div>

      {filteredJobs.length === 0 ? (
        search ? (
          <div className="text-center py-16 text-ds-textMuted">
            <p className="text-base font-medium">No job profiles match &quot;{search}&quot;.</p>
            <button onClick={() => setSearch('')} className="text-primary hover:underline text-sm mt-2 inline-block">
              Clear search
            </button>
          </div>
        ) : (
          <div className="text-center py-20 text-ds-textMuted">
            <p className="text-base font-medium">No job profiles yet.</p>
            <Link href="/jobs/new" className="text-primary hover:underline text-sm mt-2 inline-block">
              Create your first job profile →
            </Link>
          </div>
        )
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {paginatedJobs.map(job => {
              const skills    = job.job_skills || [];
              const reqCount  = skills.filter(s => s.is_required).length;
              const prefCount = skills.filter(s => !s.is_required).length;
              const topSkills = skills.slice(0, 6);
              const overflow  = skills.length - topSkills.length;
              const orgName   = job.organizations?.name || null;
              const createdAt = job.created_at
                ? new Date(job.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
                : null;

              return (
                <div key={job.id} className="bg-ds-card rounded border border-ds-border px-3 sm:px-5 py-4 hover:border-ds-borderStrong transition-colors">
                  <div className="flex items-center gap-3 sm:gap-4">
                    {/* Briefcase icon — hidden on mobile */}
                    <div className="hidden sm:flex w-10 h-10 rounded bg-ds-bg border border-ds-border items-center justify-center text-ds-textMuted flex-shrink-0">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                        strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="7" width="18" height="13" rx="2"/>
                        <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        <path d="M3 12h18"/>
                      </svg>
                    </div>

                    {/* Main content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <span className="font-heading font-semibold text-ds-text text-base">{job.title}</span>
                        {orgName && <span className="text-xs text-ds-textMuted">{orgName}</span>}
                        {createdAt && <span className="font-mono text-xs text-ds-textMuted">{createdAt}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {topSkills.map(s => (
                          <span key={s.skill}
                            className={`text-xs px-2 py-0.5 rounded font-medium border border-ds-border ${
                              s.is_required
                                ? 'bg-primary-light text-primary'
                                : 'bg-ds-bg text-ds-textSecondary'
                            }`}>
                            {s.skill}
                          </span>
                        ))}
                        {overflow > 0 && (
                          <span className="font-mono text-xs text-ds-textMuted px-1">+{overflow}</span>
                        )}
                      </div>
                    </div>

                    {/* Right side: stats + actions */}
                    <div className="flex items-center gap-4 flex-shrink-0">
                      <div className="text-right hidden sm:block">
                        <span className="font-mono text-xs text-primary font-semibold">{reqCount}</span>
                        <span className="font-mono text-xs text-ds-textMuted"> req</span>
                        <span className="font-mono text-xs text-ds-textMuted mx-2">{prefCount} pref</span>
                        {job.candidate_count > 0 && (
                          <div className="font-mono text-xs text-ds-textMuted mt-0.5">
                            {job.candidate_count} candidate{job.candidate_count !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <Link href={`/jobs/${job.id}`}
                          className="text-sm bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors">
                          View
                        </Link>
                        <Link href={`/jobs/${job.id}?edit=1`}
                          className="w-8 h-8 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors"
                          title="Edit">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 20h9"/>
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5Z"/>
                          </svg>
                        </Link>
                        <button onClick={() => setDeletingJob({ id: job.id, title: job.title })}
                          className="w-8 h-8 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-danger hover:bg-ds-dangerLight transition-colors"
                          title="Delete">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18"/>
                            <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                            <path d="M6 6v14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6"/>
                          </svg>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <Pagination
            page={effectivePage}
            totalPages={totalPages}
            total={filteredJobs.length}
            pageSize={pageSize}
            onPage={setPage}
            onPageSize={n => { setPageSize(n); setPage(1); }}
          />
        </>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';
import JobCard from './JobCard';
import JobFilters from './JobFilters';
import JobsEmptyState from './JobsEmptyState';

export default function JobsGrid() {
  const [allJobs, setAllJobs]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [reason, setReason]     = useState(null);
  const [message, setMessage]   = useState('');
  const [meta, setMeta]         = useState(null);
  const [filters, setFilters]   = useState({ type: '', date: '' });
  const [visibleCount, setVisibleCount] = useState(10);

  const load = useCallback(() => {
    setLoading(true);
    fetch('/api/v1/jobs/recommendations')
      .then(r => r.json())
      .then(d => {
        setAllJobs(d.jobs ?? []);
        setReason(d.reason ?? null);
        setMessage(d.message ?? '');
        setMeta({ city: d.location?.city, cachedAt: d.cached_at, query: d.query_used, quotaExhausted: d.quota_exhausted });
      })
      .catch(() => setAllJobs([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const interact = (jobId, action, job) => {
    fetch('/api/v1/jobs/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, job_title: job?.title, company: job?.company, action }),
    }).catch(() => {});
  };

  const handleDismiss = (jobId) => {
    const job = allJobs.find(j => j.job_id === jobId);
    interact(jobId, 'dismissed', job);
    setAllJobs(prev => prev.filter(j => j.job_id !== jobId));
  };

  const handleSave = (jobId) => {
    const job = allJobs.find(j => j.job_id === jobId);
    interact(jobId, 'saved', job);
  };

  const handleApply = (job) => {
    interact(job.job_id, 'applied', job);
  };

  // Client-side filter
  const filtered = allJobs.filter(job => {
    if (filters.type && job.employment_type !== filters.type) return false;
    if (filters.date) {
      const cutoff = filters.date === 'week'
        ? Date.now() - 7 * 86_400_000
        : Date.now() - 30 * 86_400_000;
      if (new Date(job.posted_at).getTime() < cutoff) return false;
    }
    return true;
  });

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <div className="space-y-5">
      {/* Filters + meta */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <JobFilters filters={filters} onChange={f => { setFilters(f); setVisibleCount(10); }} />
        {meta?.cachedAt && (
          <p className="text-xs text-[#9CA3AF]">
            Updated {new Date(meta.cachedAt).toLocaleString()}
          </p>
        )}
      </div>

      {/* Quota warning */}
      {meta?.quotaExhausted && (
        <div className="text-xs bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 text-amber-700 dark:text-amber-400 rounded-xl px-4 py-2.5">
          Showing cached results — live job search quota reached for this month.
        </div>
      )}

      {/* Loading skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-2xl p-5 space-y-3 animate-pulse">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-white/10" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded" />
                <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded w-5/6" />
              </div>
              <div className="h-8 bg-gray-200 dark:bg-white/10 rounded-[10px] mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && (reason === 'incomplete_profile' || visible.length === 0) && (
        <JobsEmptyState reason={reason || 'no_results'} message={message} />
      )}

      {/* Job grid */}
      {!loading && visible.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {visible.map(job => (
              <JobCard
                key={job.job_id}
                job={job}
                onApply={handleApply}
                onSave={handleSave}
                onDismiss={handleDismiss}
              />
            ))}
          </div>

          {hasMore && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => setVisibleCount(c => c + 10)}
                className="px-6 py-2.5 text-sm font-semibold border border-[#D1DCE8] dark:border-white/10 rounded-xl text-[#185FA5] dark:text-[#5B9FD4] hover:bg-[rgba(24,95,165,0.06)] transition-colors"
              >
                Load more ({filtered.length - visibleCount} remaining)
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

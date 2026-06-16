'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import JobCard from './JobCard';
import JobFilters from './JobFilters';
import JobsEmptyState from './JobsEmptyState';

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
    </svg>
  );
}

function ProfileFieldRow({ label, value }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] w-20 flex-shrink-0">{label}</span>
      {value
        ? <span className="text-sm font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">{value}</span>
        : <span className="text-sm text-[#9CA3AF] italic">Not set</span>
      }
    </div>
  );
}

export default function JobsGrid() {
  // Profile data for the prompt card
  const [profile, setProfile]         = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);

  // Job results state
  const [triggered, setTriggered]     = useState(false);
  const [allJobs, setAllJobs]         = useState([]);
  const [loading, setLoading]         = useState(false);
  const [reason, setReason]           = useState(null);
  const [message, setMessage]         = useState('');
  const [meta, setMeta]               = useState(null);
  const [filters, setFilters]         = useState({ type: '', date: '' });
  const [visibleCount, setVisibleCount] = useState(10);

  // On mount: load profile + silently check for cached jobs
  useEffect(() => {
    fetch('/api/v1/profile')
      .then(r => r.json())
      .then(d => setProfile(d.data ?? null))
      .catch(() => {})
      .finally(() => setProfileLoading(false));

    // Auto-restore from cache if available — no spinner, silent
    fetch('/api/v1/jobs/recommendations')
      .then(r => r.json())
      .then(d => {
        if (d.jobs?.length > 0) {
          setAllJobs(d.jobs);
          setReason(d.reason ?? null);
          setMessage(d.message ?? '');
          setMeta({
            city:           d.location?.city,
            cachedAt:       d.cached_at,
            query:          d.query_used,
            quotaExhausted: d.quota_exhausted,
          });
          setTriggered(true);
        }
      })
      .catch(() => {});
  }, []);

  const fetchJobs = useCallback(() => {
    setLoading(true);
    setAllJobs([]);
    setReason(null);
    setVisibleCount(10);
    fetch('/api/v1/jobs/recommendations')
      .then(r => r.json())
      .then(d => {
        setAllJobs(d.jobs ?? []);
        setReason(d.reason ?? null);
        setMessage(d.message ?? '');
        setMeta({
          city:           d.location?.city,
          cachedAt:       d.cached_at,
          query:          d.query_used,
          quotaExhausted: d.quota_exhausted,
        });
      })
      .catch(() => setAllJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const handleGetJobs = () => {
    setTriggered(true);
    fetchJobs();
  };

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

  const handleSave   = (jobId) => interact(jobId, 'saved',   allJobs.find(j => j.job_id === jobId));
  const handleApply  = (job)   => interact(job.job_id, 'applied', job);

  const isProfileComplete = profile?.headline && profile?.city;

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

  // ── Prompt card (before trigger) ────────────────────────────────────────────
  const promptCard = (
    <div className="bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-2xl p-8 space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.18)] flex items-center justify-center text-[#185FA5] flex-shrink-0">
          <SearchIcon />
        </div>
        <div>
          <h2 className="text-base font-bold text-[#2C2C2A] dark:text-[#E8EFF7]">Ready to find jobs?</h2>
          <p className="text-sm text-[#6B7280] dark:text-[#8BA3C1] mt-0.5">
            We'll search based on your profile details below.
          </p>
        </div>
      </div>

      {/* Profile context */}
      {profileLoading ? (
        <div className="space-y-2.5 animate-pulse">
          <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/3" />
          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/4" />
          <div className="h-3 bg-gray-100 dark:bg-white/5 rounded w-1/5" />
        </div>
      ) : (
        <div className="bg-[#F4F8FC] dark:bg-[#0D1830] rounded-xl px-5 py-4 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#9CA3AF] mb-1">Search criteria</p>
          <ProfileFieldRow label="Job Title" value={profile?.headline} />
          <ProfileFieldRow label="City"      value={profile?.city} />
          <ProfileFieldRow label="Country"   value={profile?.country} />
        </div>
      )}

      {/* Incomplete profile warning */}
      {!profileLoading && !isProfileComplete && (
        <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700/40 rounded-xl px-4 py-3">
          <svg className="flex-shrink-0 mt-0.5 text-amber-500" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div className="text-sm text-amber-700 dark:text-amber-400">
            <span className="font-semibold">Profile incomplete.</span>{' '}
            Add your{!profile?.headline ? ' job title' : ''}{!profile?.headline && !profile?.city ? ' and' : ''}{!profile?.city ? ' city' : ''} to get accurate results.{' '}
            <Link href="/profile" className="underline font-medium hover:text-amber-800 dark:hover:text-amber-300">
              Update profile →
            </Link>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleGetJobs}
        disabled={profileLoading}
        className="flex items-center gap-2 px-6 py-3 bg-[#185FA5] text-white text-sm font-semibold rounded-xl hover:bg-[#0C447C] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <SearchIcon />
        Get job recommendations
      </button>
    </div>
  );

  // ── Results view (after trigger) ─────────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* Always show prompt card so user can see what was searched + re-trigger */}
      {!triggered && promptCard}

      {/* Once triggered: show search context bar + refresh */}
      {triggered && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-xl px-4 py-3">
          <div className="flex items-center gap-3 text-sm">
            <span className="text-[#6B7280] dark:text-[#8BA3C1]">Searching for</span>
            <span className="font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">
              {profile?.headline || '—'}
            </span>
            <span className="text-[#9CA3AF]">in</span>
            <span className="font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">
              {[profile?.city, profile?.country].filter(Boolean).join(', ') || '—'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {meta?.cachedAt && !loading && (
              <span className="text-xs text-[#9CA3AF]">
                Updated {new Date(meta.cachedAt).toLocaleString()}
              </span>
            )}
            <button
              type="button"
              onClick={fetchJobs}
              disabled={loading}
              className="text-xs font-semibold text-[#185FA5] dark:text-[#5B9FD4] hover:underline disabled:opacity-40"
            >
              Refresh
            </button>
          </div>
        </div>
      )}

      {triggered && (
        <>
          {/* Filters */}
          {!loading && allJobs.length > 0 && (
            <JobFilters filters={filters} onChange={f => { setFilters(f); setVisibleCount(10); }} />
          )}

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
        </>
      )}
    </div>
  );
}

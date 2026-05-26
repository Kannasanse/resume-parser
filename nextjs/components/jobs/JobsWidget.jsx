'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import JobCard from './JobCard';
import JobsEmptyState from './JobsEmptyState';

export default function JobsWidget() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [reason, setReason]   = useState(null);
  const [message, setMessage] = useState('');
  const [meta, setMeta]       = useState(null);

  useEffect(() => {
    fetch('/api/v1/jobs/recommendations')
      .then(r => r.json())
      .then(d => {
        setJobs(d.jobs ?? []);
        setReason(d.reason ?? null);
        setMessage(d.message ?? '');
        setMeta({ city: d.location?.city, cachedAt: d.cached_at, query: d.query_used });
      })
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  const interact = (jobId, action, job) => {
    fetch('/api/v1/jobs/interact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ job_id: jobId, job_title: job?.title, company: job?.company, action }),
    }).catch(() => {});
  };

  const handleDismiss = (jobId) => {
    const job = jobs.find(j => j.job_id === jobId);
    interact(jobId, 'dismissed', job);
    setJobs(prev => prev.filter(j => j.job_id !== jobId));
  };

  const handleSave = (jobId) => {
    const job = jobs.find(j => j.job_id === jobId);
    interact(jobId, 'saved', job);
  };

  const handleApply = (job) => {
    interact(job.job_id, 'applied', job);
  };

  const displayJobs = jobs.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-[#2C2C2A] dark:text-[#E8EFF7] font-heading">
            Jobs for you
          </h2>
          {meta?.query && (
            <p className="text-xs text-[#9CA3AF] mt-0.5">Based on: {meta.query}</p>
          )}
        </div>
        {jobs.length > 0 && (
          <Link
            href="/job-recommendations"
            className="text-sm font-medium text-[#185FA5] hover:underline flex-shrink-0"
          >
            View all →
          </Link>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
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

      {/* Empty states */}
      {!loading && (reason === 'incomplete_profile' || displayJobs.length === 0) && (
        <JobsEmptyState reason={reason || 'no_results'} message={message} />
      )}

      {/* Job cards */}
      {!loading && displayJobs.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayJobs.map(job => (
            <JobCard
              key={job.job_id}
              job={job}
              onApply={handleApply}
              onSave={handleSave}
              onDismiss={handleDismiss}
            />
          ))}
        </div>
      )}

      {/* Freshness note */}
      {!loading && meta?.cachedAt && jobs.length > 0 && (
        <p className="text-xs text-[#9CA3AF] text-right">
          Updated {new Date(meta.cachedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  );
}

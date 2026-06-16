'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';

function formatDate(dateStr) {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SavedJobsPage() {
  const [saved, setSaved]     = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/jobs/saved')
      .then(r => r.json())
      .then(d => setSaved(d.saved ?? []))
      .catch(() => setSaved([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="gradient-mesh-1 min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gradient-primary">Saved jobs</h1>
          <p className="text-sm text-[var(--ds-textMuted)] mt-0.5">
            Jobs you bookmarked for later
          </p>
        </div>
        <Link
          href="/job-recommendations"
          className="text-sm font-medium text-[#185FA5] hover:underline"
        >
          ← Back to all jobs
        </Link>
      </div>

      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-xl p-4 animate-pulse">
              <div className="h-3 bg-gray-200 dark:bg-white/10 rounded w-1/3 mb-2" />
              <div className="h-2.5 bg-gray-100 dark:bg-white/5 rounded w-1/4" />
            </div>
          ))}
        </div>
      )}

      {!loading && saved.length === 0 && (
        <div className="rounded-2xl border border-dashed border-[#D1DCE8] dark:border-white/10 p-10 text-center">
          <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] mb-1">No saved jobs yet</p>
          <p className="text-xs text-[#9CA3AF] mb-4">Bookmark jobs from the recommendations page.</p>
          <Link href="/job-recommendations" className="text-sm font-semibold text-[#185FA5] hover:underline">
            Browse jobs →
          </Link>
        </div>
      )}

      {!loading && saved.length > 0 && (
        <div className="space-y-2">
          {saved.map((item, i) => (
            <div
              key={`${item.job_id}-${i}`}
              className="bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-xl px-4 py-3.5 flex items-center gap-4"
            >
              <div className="w-8 h-8 rounded-lg bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.18)] flex items-center justify-center text-[#185FA5] font-bold text-xs flex-shrink-0">
                {item.company?.[0]?.toUpperCase() ?? '?'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] truncate">{item.job_title}</p>
                <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1]">{item.company}</p>
              </div>
              <span className="text-xs text-[#9CA3AF] flex-shrink-0">{formatDate(item.created_at)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

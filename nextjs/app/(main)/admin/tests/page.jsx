'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';

const STATUS_COLORS = {
  draft:     'bg-ds-bg text-ds-textMuted border border-ds-border',
  published: 'bg-ds-successLight text-ds-success border border-ds-success/30',
  archived:  'bg-ds-warningLight text-ds-warning border border-ds-warning/30',
};

function StatusBadge({ status }) {
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded capitalize ${STATUS_COLORS[status] || STATUS_COLORS.draft}`}>
      {status}
    </span>
  );
}

export default function AdminTests() {
  const [tests, setTests]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage]     = useState(1);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit });
    if (search)       params.set('search', search);
    if (statusFilter) params.set('status', statusFilter);
    try {
      const r = await fetch(`/api/v1/admin/tests?${params}`);
      const d = await r.json();
      setTests(d.tests || []);
      setTotal(d.total || 0);
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ds-text font-heading">Tests</h1>
          <p className="text-sm text-ds-textMuted mt-0.5">Manage assessments for job profiles</p>
        </div>
        <Link href="/admin/tests/new"
          className="bg-primary text-white px-4 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark transition-colors">
          + New Test
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ds-textMuted pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search tests…"
            className="w-full pl-9 pr-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ds-textMuted hover:text-ds-text text-lg leading-none">×</button>
          )}
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-sm border border-ds-inputBorder rounded px-3 py-2 bg-ds-card text-ds-text focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">All statuses</option>
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2.5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg px-5 py-4">
              <div className="flex items-center gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex gap-3 items-center">
                    <Sk className="h-4 w-52" />
                    <Sk className="h-5 w-16 rounded-full" />
                  </div>
                  <Sk className="h-3 w-72" />
                </div>
                <div className="flex gap-2">
                  <Sk className="h-8 w-16 rounded-btn" />
                  <Sk className="h-8 w-8 rounded" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <div className="text-center py-20 text-ds-textMuted">
          <p className="text-base font-medium">{search ? `No tests match "${search}"` : 'No tests yet.'}</p>
          {!search && (
            <Link href="/admin/tests/new" className="text-primary hover:underline text-sm mt-2 inline-block">
              Create your first test →
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {tests.map(test => (
              <div key={test.id} className="bg-ds-card border border-ds-border rounded-lg px-4 sm:px-5 py-4 hover:border-ds-borderStrong transition-colors">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="font-heading font-semibold text-ds-text">{test.title}</span>
                      <StatusBadge status={test.status} />
                      {test.timer_enabled && (
                        <span className="inline-flex items-center gap-1 text-xs text-ds-textMuted bg-ds-bg border border-ds-border px-1.5 py-0.5 rounded">
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
                          {test.time_limit_minutes}m
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-ds-textMuted">
                      {test.job_profiles?.title && (
                        <span className="font-medium text-ds-textSecondary">{test.job_profiles.title}</span>
                      )}
                      <span>{test.question_count} question{test.question_count !== 1 ? 's' : ''}</span>
                      <span>{test.link_count} link{test.link_count !== 1 ? 's' : ''} sent</span>
                      <span className="font-mono">{new Date(test.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <Link href={`/admin/tests/${test.id}`}
                      className="text-sm bg-primary text-white px-3 py-1.5 rounded-btn font-medium hover:bg-primary-dark transition-colors">
                      Manage
                    </Link>
                    <Link href={`/admin/tests/${test.id}/links`}
                      className="text-sm border border-ds-border text-ds-textMuted px-3 py-1.5 rounded-btn font-medium hover:bg-ds-bg hover:text-ds-text transition-colors">
                      Links
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-xs text-ds-textMuted">
                {total} test{total !== 1 ? 's' : ''} · page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
                  ← Prev
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

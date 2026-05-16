'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { Sk } from '@/components/Skeleton';

const DATE_RANGES = [
  { label: '7 days', value: '7d' },
  { label: '30 days', value: '30d' },
  { label: '90 days', value: '90d' },
  { label: 'All time', value: 'all' },
];

function SummaryCard({ title, value, loading }) {
  return (
    <div className="bg-ds-card border border-ds-border rounded-xl p-5 flex flex-col gap-1">
      <span className="text-xs font-medium text-ds-textMuted uppercase tracking-wide">{title}</span>
      {loading ? (
        <Sk className="h-8 w-16 mt-1" />
      ) : (
        <span className="text-3xl font-bold text-ds-text">{value}</span>
      )}
    </div>
  );
}

function PlaceholderCard({ title, message }) {
  return (
    <div className="bg-ds-card border border-ds-border rounded-xl p-6">
      <h3 className="text-sm font-semibold text-ds-text mb-3">{title}</h3>
      <p className="text-sm text-ds-textMuted italic">{message}</p>
    </div>
  );
}

export default function PortfolioAnalyticsPage() {
  const { id } = useParams();
  const { user } = useAuth();

  const [portfolio, setPortfolio] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(true);
  const [portfolioError, setPortfolioError] = useState(null);

  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analyticsError, setAnalyticsError] = useState(null);

  const [dateRange, setDateRange] = useState('30d');

  useEffect(() => {
    if (!id) return;

    async function loadPortfolio() {
      setPortfolioLoading(true);
      setPortfolioError(null);
      try {
        const res = await fetch(`/api/v1/portfolios/${id}`);
        if (!res.ok) throw new Error('Failed to load portfolio');
        const data = await res.json();
        setPortfolio(data.portfolio ?? data);
      } catch (err) {
        setPortfolioError(err.message);
      } finally {
        setPortfolioLoading(false);
      }
    }

    async function loadAnalytics() {
      setAnalyticsLoading(true);
      setAnalyticsError(null);
      try {
        const res = await fetch(`/api/v1/portfolios/${id}/analytics-summary`);
        if (!res.ok) throw new Error('Analytics data unavailable');
        // Analytics data reserved for future use
      } catch (err) {
        setAnalyticsError(err.message);
      } finally {
        setAnalyticsLoading(false);
      }
    }

    Promise.all([loadPortfolio(), loadAnalytics()]);
  }, [id]);

  if (portfolioError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="bg-ds-dangerLight text-ds-danger text-sm rounded-lg p-4">
          Error loading portfolio: {portfolioError}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/portfolios/${id}/edit`}
              className="text-xs text-ds-textMuted hover:text-ds-text flex items-center gap-1 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="shrink-0">
                <path d="M9 11L5 7l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to editor
            </Link>
          </div>
          <h1 className="text-2xl font-bold text-ds-text">Analytics</h1>
          {portfolioLoading ? (
            <Sk className="h-4 w-40 mt-1" />
          ) : (
            <p className="text-sm text-ds-textMuted mt-0.5">{portfolio?.title ?? portfolio?.name ?? 'Portfolio'}</p>
          )}
        </div>

        {/* Date range filter */}
        <div className="flex flex-wrap items-center gap-1 bg-ds-bg border border-ds-border rounded-lg p-1">
          {DATE_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDateRange(r.value)}
              className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                dateRange === r.value
                  ? 'bg-primary-light text-primary'
                  : 'text-ds-textMuted hover:text-ds-text'
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total views"
          value={portfolio?.view_count ?? 0}
          loading={portfolioLoading}
        />
        <SummaryCard
          title="Views this month"
          value="—"
          loading={false}
        />
        <SummaryCard
          title="Unique visitors"
          value="—"
          loading={false}
        />
        <SummaryCard
          title="Form submissions"
          value="—"
          loading={false}
        />
      </div>

      {/* Analytics error banner */}
      {analyticsError && (
        <div className="bg-ds-dangerLight text-ds-danger text-xs rounded-lg px-4 py-3">
          Analytics detail unavailable: {analyticsError}
        </div>
      )}

      {/* Placeholder analytics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <PlaceholderCard
          title="Top Referrers"
          message="Referrer breakdown coming soon"
        />
        <PlaceholderCard
          title="Top Projects"
          message="Project click tracking coming soon"
        />
        <PlaceholderCard
          title="Geographic Breakdown"
          message="Geographic data coming soon"
        />
      </div>

      {/* Footnote */}
      <p className="text-xs text-ds-textMuted text-center pb-4">
        Full analytics data is refreshed every 24 hours.
      </p>
    </div>
  );
}

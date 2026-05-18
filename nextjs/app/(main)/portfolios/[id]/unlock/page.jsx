'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function UnlockPortfolioPage() {
  const { id: slug } = useParams();
  const [portfolioName, setPortfolioName] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/v1/portfolios/public/${slug}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data?.portfolio?.name) setPortfolioName(data.portfolio.name); })
      .catch(() => {});
  }, [slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      setError('This feature is coming soon.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[var(--c-bg)] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="nav-logo-mark">P</span>
          <span className="text-lg font-bold tracking-tight text-[var(--c-text)]">Proflect</span>
        </div>

        <div className="auth-card space-y-5">
          <div className="flex flex-col items-center text-center space-y-1">
            <div className="stat-icon mb-2">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[var(--c-text)]">
              {portfolioName || 'Protected Portfolio'}
            </h1>
            <p className="text-sm text-[var(--c-text-2)]">
              This portfolio is password-protected. Enter the password to view it.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="portfolio-password" className="block text-xs font-semibold text-[var(--c-text-2)] uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                id="portfolio-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full px-3 py-2.5 border border-[var(--ds-inputBorder)] rounded-lg text-sm text-[var(--c-text)] placeholder-[var(--c-text-3)] bg-[var(--c-bg)] focus:outline-none focus:ring-2 focus:ring-[var(--c-primary)]/30 focus:border-[var(--c-primary)] transition-colors"
              />
            </div>

            {error && (
              <div className="ds-alert ds-alert-error text-sm">{error}</div>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full bg-[var(--c-primary)] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[var(--c-primary-dark)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? 'Verifying…' : 'View portfolio'}
            </button>
          </form>

          <p className="text-center text-xs text-[var(--c-text-3)]">
            <Link href="/" className="hover:text-[var(--c-primary)] transition-colors">Go to Proflect</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

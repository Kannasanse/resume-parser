'use client';
import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function UnlockPortfolioPage() {
  const { slug } = useParams();
  const [portfolioName, setPortfolioName] = useState(null);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!slug) return;
    fetch(`/api/v1/portfolios/public/${slug}`)
      .then((res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (data?.portfolio?.name) {
          setPortfolioName(data.portfolio.name);
        }
      })
      .catch(() => {});
  }, [slug]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      // Unlock API not yet implemented
      setError('This feature is coming soon.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] px-4">
      <div className="max-w-sm mx-auto mt-24 bg-white border border-[#D1DCE8] rounded-2xl p-8 shadow-sm">
        {/* Lock icon */}
        <div className="flex justify-center mb-6">
          <svg
            width="40"
            height="40"
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <rect x="8" y="18" width="24" height="18" rx="3" fill="#D1DCE8" />
            <path
              d="M13 18v-5a7 7 0 0 1 14 0v5"
              stroke="#6B7280"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
            />
            <circle cx="20" cy="27" r="2.5" fill="#6B7280" />
          </svg>
        </div>

        <h1 className="text-xl font-bold text-[#2C2C2A] text-center mb-1">
          {portfolioName ? `${portfolioName}` : 'Protected Portfolio'}
        </h1>
        <p className="text-sm text-[#6B7280] text-center mb-6">
          This portfolio is password-protected. Enter the password to view it.
        </p>

        <form onSubmit={handleSubmit} noValidate>
          <label
            htmlFor="portfolio-password"
            className="block text-sm font-medium text-[#2C2C2A] mb-1.5"
          >
            Password
          </label>
          <input
            id="portfolio-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            required
            className="w-full px-3 py-2.5 border border-[#D1DCE8] rounded-lg text-sm text-[#2C2C2A] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#185FA5]/30 focus:border-[#185FA5] transition-colors"
          />

          {error && (
            <p className="mt-2 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !password}
            className="mt-4 w-full bg-[#185FA5] text-white py-2.5 rounded-lg font-medium text-sm hover:bg-[#0C447C] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && (
              <svg
                className="animate-spin h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
            )}
            {loading ? 'Verifying…' : 'View portfolio'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-[#6B7280]">
          <Link href="/home" className="hover:text-[#185FA5] transition-colors">
            Go to Proflect
          </Link>
        </p>
      </div>
    </div>
  );
}

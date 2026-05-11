'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    if (!email) { setError('Email is required.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address.'); return; }

    setLoading(true);
    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error: sbError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      if (sbError) throw sbError;
      setDone(true);
    } catch (err) {
      setError(err.message || "Couldn't send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="Proflect" width={120} height={133} className="object-contain mx-auto" priority unoptimized />
          </div>
          <div className="bg-ds-card rounded-2xl border border-ds-border shadow-lg p-10 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-ds-successLight flex items-center justify-center mx-auto">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-success">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold text-ds-text">Check your inbox</h1>
            <p className="text-sm text-ds-textSecondary">
              Reset link sent to <strong className="text-ds-text">{email}</strong>. Link expires in 1 hour.
            </p>
            <p className="text-xs text-ds-textMuted">Check your spam folder if you don't see it.</p>
            <button onClick={() => setDone(false)}
              className="text-sm text-primary hover:underline font-medium">
              Send again
            </button>
            <div>
              <Link href="/login" className="block text-xs text-ds-textMuted hover:text-ds-text">← Back to login</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Proflect" width={120} height={133} className="object-contain mx-auto" priority unoptimized />
        </div>

        <div className="bg-ds-card rounded-2xl border border-ds-border shadow-lg p-10 space-y-5">
          <Link href="/login" className="flex items-center gap-1.5 text-xs text-ds-textMuted hover:text-ds-text -mb-1">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 5l-7 7 7 7"/>
            </svg>
            Back to login
          </Link>

          <div className="flex flex-col items-center text-center space-y-1 pt-1">
            <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center mb-2">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h1 className="text-xl font-bold text-ds-text font-heading">Forgot your password?</h1>
            <p className="text-sm text-ds-textSecondary">Enter your email and we'll send you a reset link.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                className={`w-full border rounded-lg px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${error ? 'border-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`} />
              {error && <p className="text-xs text-ds-danger mt-1">{error}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</span>
                : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
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
      const redirectTo = `${window.location.origin}/auth/callback?next=/reset-password`;
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
          <div className="flex flex-col items-center gap-2 mb-8">
            <span className="nav-logo-mark">P</span>
            <span className="text-lg font-bold tracking-tight text-[var(--c-text)]">Proflect</span>
          </div>
          <div className="auth-card text-center space-y-4">
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
    <div className="min-h-screen flex">
      <div className="hidden md:flex md:w-[42%] flex-col justify-between bg-gradient-to-br from-[#185FA5] to-[#0C447C] p-12 relative overflow-hidden flex-shrink-0">
        <div className="absolute inset-0 opacity-[0.08]" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
        <div className="relative">
          <p className="text-white font-extrabold text-2xl font-heading tracking-tight">Proflect</p>
        </div>
        <div className="relative space-y-3">
          <h2 className="text-white text-[32px] font-extrabold leading-tight font-heading">Your career map starts here.</h2>
          <p className="text-white/70 text-sm">Resume builder · Career map · Interview prep · Portfolio</p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8 bg-ds-bg">
      <div className="w-full max-w-sm">

        <div className="auth-card space-y-5">
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
              className="btn-primary w-full py-2.5 text-sm font-semibold disabled:opacity-50">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</span>
                : 'Send Reset Link'}
            </button>
          </form>
        </div>
      </div>
      </div>
    </div>
  );
}

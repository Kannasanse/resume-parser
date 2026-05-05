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
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-ds-successLight flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-success">
              <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
            </svg>
          </div>
          <h1 className="font-heading text-xl font-bold text-ds-text">Check your inbox</h1>
          <p className="text-sm text-ds-textMuted">
            If an account exists for <strong className="text-ds-text">{email}</strong>,
            we've sent a password reset link. The link expires in 1 hour.
          </p>
          <p className="text-xs text-ds-textMuted">Check your spam folder if you don't see it.</p>
          <Link href="/login" className="block text-xs text-ds-textMuted hover:text-ds-text">← Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="Resume Builder" width={140} height={77} className="object-contain" priority />
          </div>
          <p className="text-sm text-ds-textMuted">Reset your password</p>
        </div>

        <div className="bg-ds-card rounded-lg border border-ds-border p-6 space-y-4">
          <p className="text-sm text-ds-textMuted">
            Enter your email address and we'll send you a link to reset your password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                className={`w-full border rounded px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${error ? 'border-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`} />
              {error && <p className="text-xs text-ds-danger mt-1">{error}</p>}
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</span>
                : 'Send Reset Link'}
            </button>
          </form>

          <div className="border-t border-ds-border pt-4 text-center">
            <Link href="/login" className="text-xs text-ds-textMuted hover:text-ds-text">← Back to login</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

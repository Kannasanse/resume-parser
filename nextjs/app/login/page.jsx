'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase-browser';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lockoutMins, setLockoutMins] = useState(0);
  const [unverified, setUnverified] = useState(false);

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setError('');
    setUnverified(false);
    setLockoutMins(0);
    if (!email || !password) { setError('Email and password are required.'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'LOCKED_OUT') {
          setLockoutMins(data.minutesLeft || 15);
        } else if (data.code === 'EMAIL_NOT_VERIFIED') {
          setUnverified(true);
        } else {
          setError(data.error || 'Invalid email or password.');
        }
        return;
      }

      // Session is now set via cookie — refresh and navigate
      router.push(redirect || (data.isAdmin ? '/resumes' : '/builder'));
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (hasError) =>
    `w-full border rounded px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${hasError ? 'border-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`;

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="Resume Builder" width={160} height={88} className="object-contain" priority />
          </div>
          <p className="text-sm text-ds-textMuted">Sign in to your account</p>
        </div>

        <div className="bg-ds-card rounded-lg border border-ds-border p-6 space-y-4">
          {lockoutMins > 0 && (
            <div className="text-sm text-ds-danger bg-ds-dangerLight rounded px-3 py-2">
              Account temporarily locked. Try again in <strong>{lockoutMins} minute{lockoutMins !== 1 ? 's' : ''}</strong>.
            </div>
          )}

          {unverified && (
            <div className="text-sm text-ds-textMuted bg-ds-bg border border-ds-border rounded px-3 py-2 space-y-1">
              <p>Please verify your email before logging in.</p>
              <Link href={`/verify-email?email=${encodeURIComponent(email)}`} className="text-primary hover:underline text-xs font-medium">
                Resend verification email →
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                className={inputCls(!!error && !lockoutMins && !unverified)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Password</label>
                <Link href="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••" autoComplete="current-password"
                  className={`${inputCls(!!error && !lockoutMins && !unverified)} pr-10`} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ds-textMuted hover:text-ds-text text-xs">
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && !lockoutMins && !unverified && (
              <p className="text-sm text-ds-danger bg-ds-dangerLight rounded px-3 py-2">{error}</p>
            )}

            <button type="submit" disabled={loading || lockoutMins > 0}
              className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in…</span>
                : 'Sign In'}
            </button>
          </form>

          <div className="border-t border-ds-border pt-4 text-center">
            <p className="text-xs text-ds-textMuted">
              Don't have an account?{' '}
              <Link href="/signup" className="text-primary hover:underline font-medium">Create one</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

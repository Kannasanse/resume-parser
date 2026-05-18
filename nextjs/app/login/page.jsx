'use client';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';
import { setAuthToken } from '@/lib/authToken';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
      <path fill="none" d="M0 0h48v48H0z"/>
    </svg>
  );
}

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') || '';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError]       = useState('');
  const [lockoutMins, setLockoutMins] = useState(0);
  const [unverified, setUnverified]   = useState(false);
  const [hashError, setHashError]     = useState(null);

  useEffect(() => {
    const hash = new URLSearchParams(window.location.hash.replace('#', ''));
    const errCode = hash.get('error_code');
    const errDesc = hash.get('error_description');
    if (errCode === 'otp_expired') {
      setHashError('Your password reset link has expired. Please request a new one.');
    } else if (errCode === 'access_denied' || errDesc) {
      setHashError(errDesc?.replace(/\+/g, ' ') || 'The link is invalid or has expired.');
    }
    // Clean the hash from the URL without reloading
    if (hash.get('error')) window.history.replaceState(null, '', window.location.pathname + window.location.search);
  }, []);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    const supabase = createClient();
    const callbackUrl = `${window.location.origin}/auth/callback${redirect ? `?next=${encodeURIComponent(redirect)}` : ''}`;
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callbackUrl },
    });
  };

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

      if (data.access_token) setAuthToken(data.access_token);
      router.push(redirect || (data.isAdmin ? '/resumes' : '/builder'));
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (hasError) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${hasError ? 'border-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`;

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="nav-logo-mark">P</span>
          <span className="text-lg font-bold tracking-tight text-[var(--c-text)]">Proflect</span>
        </div>

        <div className="auth-card space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-ds-text font-heading">Welcome back</h1>
            <p className="text-sm text-ds-textSecondary">Sign in to your account</p>
          </div>

          {hashError && (
            <div className="ds-alert ds-alert-error text-sm">
              {hashError}{' '}
              <Link href="/forgot-password" className="underline font-medium">Request new link</Link>
            </div>
          )}

          {lockoutMins > 0 && (
            <div className="ds-alert ds-alert-error text-sm">
              Account locked. Try again in <strong>{lockoutMins} minute{lockoutMins !== 1 ? 's' : ''}</strong>.
            </div>
          )}

          {unverified && (
            <div className="ds-alert ds-alert-warning text-sm">
              Please verify your email.{' '}
              <Link href={`/verify-email?email=${encodeURIComponent(email)}`} className="underline font-medium">
                Resend link
              </Link>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com" autoComplete="email"
                className={inputCls(!!error && !lockoutMins && !unverified)} />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide">Password</label>
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
              <div className="ds-alert ds-alert-error text-sm">{error}</div>
            )}

            <button type="submit" disabled={loading || googleLoading || lockoutMins > 0}
              className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Signing in…</span>
                : 'Sign In'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-ds-border" />
            <span className="text-xs text-ds-textMuted">or</span>
            <div className="flex-1 border-t border-ds-border" />
          </div>

          <button onClick={handleGoogle} disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 border border-ds-border rounded-btn py-2.5 text-sm font-medium text-ds-text bg-ds-card hover:bg-ds-bg hover:border-ds-borderStrong disabled:opacity-50 transition-colors">
            {googleLoading
              ? <span className="w-4 h-4 border-2 border-ds-border border-t-primary rounded-full animate-spin" />
              : <GoogleIcon />}
            Continue with Google
          </button>

          <p className="text-sm text-center text-ds-textSecondary">
            Don't have an account?{' '}
            <Link href="/signup" className="text-primary hover:underline font-medium">Sign up</Link>
          </p>
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

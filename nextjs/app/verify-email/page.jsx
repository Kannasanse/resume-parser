'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [status, setStatus] = useState('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleResend = async () => {
    if (!email || cooldown > 0 || status === 'sending') return;
    setStatus('sending');
    setErrorMsg('');
    try {
      const res = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (res.status === 429) {
          const mins = data.retryAfter || 60;
          setErrorMsg(`Too many requests. Try again in ${mins} minute${mins !== 1 ? 's' : ''}.`);
          setCooldown(mins * 60);
        } else {
          setErrorMsg(data.error || "Couldn't resend. Please try again.");
        }
        setStatus('error');
        return;
      }
      setStatus('sent');
      setCooldown(60);
    } catch {
      setErrorMsg("Couldn't resend. Please try again.");
      setStatus('error');
    }
  };

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="nav-logo-mark">P</span>
          <span className="text-lg font-bold tracking-tight text-[var(--c-text)]">Proflect</span>
        </div>

        <div className="auth-card text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-primary-light flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
              <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
            </svg>
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-xl font-bold text-ds-text">Check your inbox</h1>
            <p className="text-sm text-ds-textSecondary">
              We sent a verification link to{' '}
              {email ? <strong className="text-ds-text">{email}</strong> : 'your email address'}.
            </p>
          </div>

          <div className="text-sm text-ds-textSecondary bg-ds-bg border border-ds-border rounded-lg px-4 py-3 text-left">
            Didn't receive it? Check your spam folder.
          </div>

          {status === 'sent' && (
            <div className="ds-alert ds-alert-success text-sm">Verification email resent!</div>
          )}
          {errorMsg && (
            <div className="ds-alert ds-alert-error text-sm">{errorMsg}</div>
          )}

          <button
            onClick={handleResend}
            disabled={!email || cooldown > 0 || status === 'sending'}
            className="w-full border border-ds-border rounded-btn py-2.5 text-sm font-medium text-ds-text hover:bg-ds-bg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {status === 'sending'
              ? 'Sending…'
              : cooldown > 0
                ? `Resend in ${cooldown}s`
                : 'Resend verification email'}
          </button>

          <p className="text-xs text-ds-textMuted">You can resend up to 3 times per hour.</p>

          <Link href="/login" className="block text-xs text-ds-textMuted hover:text-ds-text">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

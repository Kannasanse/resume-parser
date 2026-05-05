'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [status, setStatus] = useState('idle'); // 'idle' | 'sending' | 'sent' | 'error'
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
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="Resume Builder" width={140} height={77} className="object-contain" priority />
          </div>
        </div>

        <div className="bg-ds-card rounded-lg border border-ds-border p-6 text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-ds-successLight flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-success">
              <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
            </svg>
          </div>

          <div>
            <h1 className="font-heading text-xl font-bold text-ds-text">Verify your email</h1>
            <p className="text-sm text-ds-textMuted mt-2">
              We've sent a verification link to{' '}
              {email ? <strong className="text-ds-text">{email}</strong> : 'your email address'}.
              <br />Click the link to activate your account.
            </p>
          </div>

          {status === 'sent' && (
            <p className="text-sm text-ds-success bg-ds-successLight rounded px-3 py-2">
              Verification email resent!
            </p>
          )}
          {errorMsg && (
            <p className="text-sm text-ds-danger bg-ds-dangerLight rounded px-3 py-2">{errorMsg}</p>
          )}

          <div className="border-t border-ds-border pt-4 space-y-2">
            <p className="text-xs text-ds-textMuted">Didn't get the email?</p>
            <button
              onClick={handleResend}
              disabled={!email || cooldown > 0 || status === 'sending'}
              className="text-sm text-primary hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed font-medium"
            >
              {status === 'sending'
                ? 'Sending…'
                : cooldown > 0
                  ? `Resend in ${cooldown}s`
                  : 'Resend verification email'}
            </button>
            <p className="text-xs text-ds-textMuted">
              Check your spam folder if you don't see it.
            </p>
          </div>

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

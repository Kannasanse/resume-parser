'use client';
import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

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

function passwordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)                    score++;
  if (/[A-Z]/.test(pwd))                  score++;
  if (/[0-9]/.test(pwd))                  score++;
  if (/[^A-Za-z0-9]/.test(pwd))           score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-error', 'bg-amber-400', 'bg-warning', 'bg-success'];
const STRENGTH_TEXT   = ['', 'text-error', 'text-amber-500', 'text-warning', 'text-success'];

export default function SignUpPage() {
  const [form, setForm]       = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors]   = useState({});
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [done, setDone]       = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setServerError('');
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  function validate() {
    const e = {};
    if (!form.firstName.trim())  e.firstName = 'First name is required.';
    if (form.firstName.trim().length > 100) e.firstName = 'Max 100 characters.';
    if (!form.lastName.trim())   e.lastName  = 'Last name is required.';
    if (form.lastName.trim().length > 100) e.lastName = 'Max 100 characters.';
    if (!form.email)             e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Please enter a valid email address.';
    if (!form.password)          e.password = 'Password is required.';
    else {
      const msgs = [];
      if (form.password.length < 8)           msgs.push('at least 8 characters');
      if (!/[A-Z]/.test(form.password))       msgs.push('one uppercase letter');
      if (!/[0-9]/.test(form.password))       msgs.push('one number');
      if (!/[^A-Za-z0-9]/.test(form.password)) msgs.push('one special character');
      if (msgs.length) e.password = `Password must include ${msgs.join(', ')}.`;
    }
    if (!form.confirm)           e.confirm = 'Please confirm your password.';
    else if (form.confirm !== form.password) e.confirm = 'Passwords do not match.';
    return e;
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    setServerError('');
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length) return;

    setLoading(true);
    try {
      const res = await fetch('/api/v1/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          email: form.email,
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === 'EMAIL_EXISTS') {
          setErrors({ email: 'An account with this email already exists. Try logging in instead.' });
        } else {
          setServerError(data.error || "We couldn't create your account. Please try again.");
        }
        return;
      }
      setDone(true);
    } catch {
      setServerError("We couldn't create your account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(form.password);
  const inputCls = (field) =>
    `input-enhanced w-full border rounded-lg px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${errors[field] ? 'border-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`;

  if (done) {
    return (
      <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-ds-successLight flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-success">
              <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
            </svg>
          </div>
          <h1 className="font-heading text-xl font-bold text-ds-text">Check your inbox!</h1>
          <p className="text-sm text-ds-textSecondary">
            We've sent a verification link to <strong className="text-ds-text">{form.email}</strong>.<br />
            Click the link to activate your account.
          </p>
          <p className="text-xs text-ds-textMuted">
            Didn't get it?{' '}
            <Link href={`/verify-email?email=${encodeURIComponent(form.email)}`} className="text-primary hover:underline">
              Resend email
            </Link>
          </p>
          <Link href="/login" className="block text-xs text-ds-textMuted hover:text-ds-text">← Back to login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="gradient-mesh-1 min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="nav-logo-mark">P</span>
          <span className="text-lg font-bold tracking-tight text-[var(--c-text)]">Proflect</span>
        </div>

        <div className="auth-card glass-light animate-fade-in-scale space-y-5">
          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-ds-text font-heading">Create your account</h1>
            <p className="text-sm text-ds-textSecondary">Join Proflect today</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">First Name</label>
                <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane"
                  className={inputCls('firstName')} maxLength={100} />
                {errors.firstName && <p className="text-xs text-ds-danger mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Last Name</label>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith"
                  className={inputCls('lastName')} maxLength={100} />
                {errors.lastName && <p className="text-xs text-ds-danger mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="jane@example.com" autoComplete="email" className={inputCls('email')} />
              {errors.email && <p className="text-xs text-ds-danger mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Password</label>
              <div className="relative">
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••" autoComplete="new-password" className={`${inputCls('password')} pr-10`} />
                <button type="button" onClick={() => setShowPwd(v => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ds-textMuted hover:text-ds-text text-xs">
                  {showPwd ? 'Hide' : 'Show'}
                </button>
              </div>
              {form.password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map(i => (
                      <div key={i} className={`h-1.5 flex-1 rounded-full transition-colors ${i <= strength ? STRENGTH_COLORS[strength] : 'bg-ds-border'}`} />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${STRENGTH_TEXT[strength]}`}>{STRENGTH_LABELS[strength]}</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-ds-danger mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                placeholder="••••••••" autoComplete="new-password" className={inputCls('confirm')} />
              {errors.confirm && <p className="text-xs text-ds-danger mt-1">{errors.confirm}</p>}
            </div>

            {serverError && (
              <div className="ds-alert ds-alert-error text-sm">{serverError}</div>
            )}

            <button type="submit" disabled={loading || googleLoading}
              className="btn-primary w-full disabled:opacity-50">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account…</span>
                : 'Create Account'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="flex-1 border-t border-ds-border" />
            <span className="text-xs text-ds-textMuted">or</span>
            <div className="flex-1 border-t border-ds-border" />
          </div>

          <button onClick={handleGoogle} disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 border border-ds-border rounded-btn py-2.5 text-sm font-medium text-ds-text bg-ds-card hover:bg-ds-bg hover:border-ds-borderStrong hover:shadow-sm disabled:opacity-50 transition-colors">
            {googleLoading
              ? <span className="w-4 h-4 border-2 border-ds-border border-t-primary rounded-full animate-spin" />
              : <GoogleIcon />}
            Continue with Google
          </button>

          <p className="text-sm text-center text-ds-textSecondary">
            Already have an account?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';

function passwordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)                    score++;
  if (/[A-Z]/.test(pwd))                  score++;
  if (/[0-9]/.test(pwd))                  score++;
  if (/[^A-Za-z0-9]/.test(pwd))           score++;
  return score; // 0-4
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-ds-danger', 'bg-amber-400', 'bg-ds-warning', 'bg-ds-success'];

export default function SignUpPage() {
  const [form, setForm]     = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [done, setDone]     = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPwd, setShowPwd] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

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
    `w-full border rounded px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${errors[field] ? 'border-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`;

  if (done) {
    return (
      <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-full bg-ds-successLight flex items-center justify-center mx-auto">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-ds-success">
              <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
            </svg>
          </div>
          <h1 className="font-heading text-xl font-bold text-ds-text">Check your inbox!</h1>
          <p className="text-sm text-ds-textMuted">
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
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="flex justify-center mb-3">
            <Image src="/logo.png" alt="Resume Builder" width={140} height={77} className="object-contain" priority />
          </div>
          <p className="text-sm text-ds-textMuted">Create your account</p>
        </div>

        <div className="bg-ds-card rounded-lg border border-ds-border p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">First Name</label>
                <input value={form.firstName} onChange={e => set('firstName', e.target.value)} placeholder="Jane"
                  className={inputCls('firstName')} maxLength={100} />
                {errors.firstName && <p className="text-xs text-ds-danger mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Last Name</label>
                <input value={form.lastName} onChange={e => set('lastName', e.target.value)} placeholder="Smith"
                  className={inputCls('lastName')} maxLength={100} />
                {errors.lastName && <p className="text-xs text-ds-danger mt-1">{errors.lastName}</p>}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="jane@example.com" autoComplete="email" className={inputCls('email')} />
              {errors.email && <p className="text-xs text-ds-danger mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Password</label>
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
                      <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? STRENGTH_COLORS[strength] : 'bg-ds-border'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-ds-textMuted">{STRENGTH_LABELS[strength]}</p>
                </div>
              )}
              {errors.password && <p className="text-xs text-ds-danger mt-1">{errors.password}</p>}
            </div>

            <div>
              <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Confirm Password</label>
              <input type="password" value={form.confirm} onChange={e => set('confirm', e.target.value)}
                placeholder="••••••••" autoComplete="new-password" className={inputCls('confirm')} />
              {errors.confirm && <p className="text-xs text-ds-danger mt-1">{errors.confirm}</p>}
            </div>

            {serverError && (
              <p className="text-sm text-ds-danger bg-ds-dangerLight rounded px-3 py-2">{serverError}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Creating account…</span>
                : 'Create Account'}
            </button>
          </form>

          <div className="border-t border-ds-border pt-4 text-center">
            <p className="text-xs text-ds-textMuted">
              Already have an account?{' '}
              <Link href="/login" className="text-primary hover:underline font-medium">Sign in</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

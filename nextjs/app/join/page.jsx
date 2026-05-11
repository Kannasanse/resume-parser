'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

function passwordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)             score++;
  if (/[A-Z]/.test(pwd))           score++;
  if (/[0-9]/.test(pwd))           score++;
  if (/[^A-Za-z0-9]/.test(pwd))   score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-error', 'bg-amber-400', 'bg-warning', 'bg-success'];
const STRENGTH_TEXT   = ['', 'text-error', 'text-amber-500', 'text-warning', 'text-success'];

function JoinContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token') || '';

  const [tokenData, setTokenData] = useState(null);
  const [tokenStatus, setTokenStatus] = useState('loading');
  const [form, setForm] = useState({ firstName: '', lastName: '', password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!token) { setTokenStatus('invalid'); return; }
    fetch(`/api/v1/auth/invite?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setTokenStatus(data.code === 'TOKEN_EXPIRED' ? 'expired' : data.code === 'TOKEN_USED' ? 'used' : 'invalid');
        } else {
          setTokenData({ email: data.email, role: data.role });
          setTokenStatus('valid');
        }
      })
      .catch(() => setTokenStatus('invalid'));
  }, [token]);

  function validate() {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'First name is required.';
    if (form.firstName.trim().length > 100) e.firstName = 'Max 100 characters.';
    if (!form.lastName.trim())  e.lastName  = 'Last name is required.';
    if (form.lastName.trim().length > 100) e.lastName = 'Max 100 characters.';
    if (!form.password) e.password = 'Password is required.';
    else {
      const msgs = [];
      if (form.password.length < 8)             msgs.push('at least 8 characters');
      if (!/[A-Z]/.test(form.password))         msgs.push('one uppercase letter');
      if (!/[0-9]/.test(form.password))         msgs.push('one number');
      if (!/[^A-Za-z0-9]/.test(form.password)) msgs.push('one special character');
      if (msgs.length) e.password = `Password must include ${msgs.join(', ')}.`;
    }
    if (!form.confirm)                        e.confirm = 'Please confirm your password.';
    else if (form.confirm !== form.password)  e.confirm = 'Passwords do not match.';
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
      const res = await fetch('/api/v1/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          password: form.password,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Couldn't complete setup. Please try again.");
        return;
      }
      setDone(true);
    } catch {
      setServerError("Couldn't complete setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const strength = passwordStrength(form.password);
  const inputCls = (field) =>
    `w-full border rounded-lg px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${errors[field] ? 'border-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`;

  if (tokenStatus === 'loading') {
    return (
      <div className="min-h-screen bg-ds-bg flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (tokenStatus !== 'valid') {
    const msgs = {
      expired: { title: 'Invitation expired', body: 'This invitation link has expired. Please ask an admin to send a new one.', severity: 'danger' },
      used:    { title: 'Invitation already used', body: 'This invitation has already been accepted. Try logging in.', severity: 'warning' },
      invalid: { title: 'Invalid invitation', body: 'This invitation link is not valid. Please check the link or ask for a new one.', severity: 'danger' },
    };
    const { title, body, severity } = msgs[tokenStatus] || msgs.invalid;
    const isDanger = severity === 'danger';
    return (
      <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="text-center mb-8">
            <Image src="/logo.png" alt="Proflect" width={120} height={133} className="object-contain mx-auto" priority unoptimized />
          </div>
          <div className="bg-ds-card rounded-2xl border border-ds-border shadow-lg p-10 text-center space-y-4">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ${isDanger ? 'bg-ds-dangerLight' : 'bg-ds-warningLight'}`}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isDanger ? 'text-ds-danger' : 'text-ds-warning'}>
                <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </div>
            <h1 className="font-heading text-xl font-bold text-ds-text">{title}</h1>
            <p className="text-sm text-ds-textSecondary">{body}</p>
            <Link href="/login" className="block text-sm text-primary hover:underline">← Back to login</Link>
          </div>
        </div>
      </div>
    );
  }

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
            <h1 className="font-heading text-xl font-bold text-ds-text">Account created!</h1>
            <p className="text-sm text-ds-textSecondary">
              Your account is ready. You can now sign in as <strong className="text-ds-text">{tokenData?.email}</strong>.
            </p>
            <button onClick={() => router.push('/login')}
              className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark transition-colors">
              Go to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Proflect" width={120} height={133} className="object-contain mx-auto" priority unoptimized />
        </div>

        <div className="bg-ds-card rounded-2xl border border-ds-border shadow-lg p-10 space-y-5">
          {tokenData?.role && (
            <div className="flex justify-center">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary bg-primary-light px-3 py-1.5 rounded-btn capitalize">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                Invited as {tokenData.role}
              </span>
            </div>
          )}

          <div className="text-center space-y-1">
            <h1 className="text-xl font-bold text-ds-text font-heading">Accept your invitation</h1>
            <p className="text-sm text-ds-textSecondary">You've been invited to join Proflect.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Email Address</label>
              <input type="email" value={tokenData?.email || ''} readOnly
                className="w-full border border-ds-inputBorder rounded-lg px-3 py-2.5 text-sm bg-ds-bg/50 text-ds-textMuted cursor-not-allowed" />
            </div>

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
              <div className="text-sm text-ds-danger bg-ds-dangerLight rounded-lg px-4 py-3">{serverError}</div>
            )}

            <button type="submit" disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Setting up account…</span>
                : 'Accept & Join'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  );
}

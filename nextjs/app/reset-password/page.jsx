'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { createClient } from '@/lib/supabase-browser';

function passwordStrength(pwd) {
  let score = 0;
  if (pwd.length >= 8)             score++;
  if (/[A-Z]/.test(pwd))           score++;
  if (/[0-9]/.test(pwd))           score++;
  if (/[^A-Za-z0-9]/.test(pwd))   score++;
  return score;
}

const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
const STRENGTH_COLORS = ['', 'bg-ds-danger', 'bg-amber-400', 'bg-ds-warning', 'bg-ds-success'];

function ResetPasswordContent() {
  const router = useRouter();
  const [form, setForm] = useState({ password: '', confirm: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [sessionReady, setSessionReady] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // Supabase sends the recovery token via URL hash fragment (#access_token=...) which
  // the browser-side client picks up automatically via onAuthStateChange.
  useEffect(() => {
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setSessionReady(true);
    });
    // Also check current session in case event already fired
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setSessionReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  function validate() {
    const e = {};
    if (!form.password) e.password = 'Password is required.';
    else {
      const msgs = [];
      if (form.password.length < 8)             msgs.push('at least 8 characters');
      if (!/[A-Z]/.test(form.password))         msgs.push('one uppercase letter');
      if (!/[0-9]/.test(form.password))         msgs.push('one number');
      if (!/[^A-Za-z0-9]/.test(form.password)) msgs.push('one special character');
      if (msgs.length) e.password = `Password must include ${msgs.join(', ')}.`;
    }
    if (!form.confirm)                       e.confirm = 'Please confirm your password.';
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
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: form.password });
      if (error) throw error;
      setDone(true);
    } catch (err) {
      setServerError(err.message || "Couldn't update password. Please try again.");
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
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 className="font-heading text-xl font-bold text-ds-text">Password updated!</h1>
          <p className="text-sm text-ds-textMuted">Your password has been changed. You can now log in with your new password.</p>
          <button onClick={() => router.push('/login')}
            className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary/90 transition-colors">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (!sessionReady) {
    return (
      <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-ds-textMuted">Validating reset link…</p>
          <p className="text-xs text-ds-textMuted">
            If this takes more than a few seconds, your link may be invalid.{' '}
            <Link href="/forgot-password" className="text-primary hover:underline">Request a new one</Link>.
          </p>
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
          <p className="text-sm text-ds-textMuted">Set a new password</p>
        </div>

        <div className="bg-ds-card rounded-lg border border-ds-border p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">New Password</label>
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
                ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Updating…</span>
                : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

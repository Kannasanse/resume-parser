'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    const supabase = createClient();

    try {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push('/resumes');
        router.refresh();
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Check your email to confirm your account before signing in.');
        setMode('signin');
      }
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputCls = 'w-full border border-ds-inputBorder rounded px-3 py-2.5 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors';

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex items-center gap-1.5 mb-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary inline-block" />
            <span className="font-heading font-bold text-ds-text text-xl tracking-tight">
              profile<span className="text-primary"> </span>stream
            </span>
          </div>
          <p className="text-sm text-ds-textMuted">
            {mode === 'signin' ? 'Sign in to your account' : 'Create a new account'}
          </p>
        </div>

        {/* Card */}
        <div className="bg-ds-card rounded-lg border border-ds-border p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                autoComplete="email"
                className={inputCls}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                className={inputCls}
              />
            </div>

            {error && (
              <p className="text-sm text-ds-danger bg-ds-dangerLight rounded px-3 py-2">{error}</p>
            )}
            {message && (
              <p className="text-sm text-ds-success bg-ds-successLight rounded px-3 py-2">{message}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
                  </span>
                : mode === 'signin' ? 'Sign In' : 'Create Account'
              }
            </button>
          </form>

          <div className="border-t border-ds-border pt-4 text-center">
            <p className="text-xs text-ds-textMuted">
              {mode === 'signin' ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); setMessage(''); }}
                className="text-primary hover:underline font-medium"
              >
                {mode === 'signin' ? 'Create one' : 'Sign in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

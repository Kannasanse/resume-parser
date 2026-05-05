'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function NewTest() {
  const router = useRouter();
  const [jobs, setJobs] = useState([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    job_profile_id: '',
    timer_enabled: false,
    time_limit_minutes: 30,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/v1/jobs')
      .then(r => r.json())
      .then(d => setJobs(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { setError('Title is required'); return; }
    setSubmitting(true);
    setError('');
    try {
      const r = await fetch('/api/v1/admin/tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          job_profile_id: form.job_profile_id || null,
          time_limit_minutes: parseInt(form.time_limit_minutes) || 30,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to create test');
      router.push(`/admin/tests/${d.test.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin/tests" className="text-ds-textMuted hover:text-ds-text transition-colors">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-ds-text font-heading">New Test</h1>
          <p className="text-sm text-ds-textMuted mt-0.5">Create an assessment for candidates</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-5">
        {error && (
          <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-4 py-2.5">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-ds-text mb-1.5">Title <span className="text-ds-danger">*</span></label>
          <input
            value={form.title}
            onChange={e => set('title', e.target.value)}
            placeholder="e.g. Frontend Developer Assessment"
            className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ds-text mb-1.5">Description</label>
          <textarea
            value={form.description}
            onChange={e => set('description', e.target.value)}
            placeholder="Brief instructions or context for candidates…"
            rows={3}
            className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ds-text mb-1.5">Job Profile</label>
          <select
            value={form.job_profile_id}
            onChange={e => set('job_profile_id', e.target.value)}
            className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">No specific job profile</option>
            {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
          </select>
        </div>

        <div className="space-y-3">
          <label className="block text-sm font-medium text-ds-text">Timer</label>
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => set('timer_enabled', !form.timer_enabled)}
              className={`w-10 h-5.5 rounded-full relative transition-colors cursor-pointer ${form.timer_enabled ? 'bg-primary' : 'bg-ds-border'}`}
              style={{ width: 40, height: 22 }}
            >
              <div className={`absolute top-0.5 w-4.5 h-4.5 rounded-full bg-white shadow transition-transform ${form.timer_enabled ? 'translate-x-5' : 'translate-x-0.5'}`}
                style={{ width: 18, height: 18, top: 2, transform: form.timer_enabled ? 'translateX(20px)' : 'translateX(2px)' }}
              />
            </div>
            <span className="text-sm text-ds-text">{form.timer_enabled ? 'Timer enabled' : 'No timer'}</span>
          </label>

          {form.timer_enabled && (
            <div className="flex items-center gap-2">
              <input
                type="number"
                min="1"
                max="480"
                value={form.time_limit_minutes}
                onChange={e => set('time_limit_minutes', e.target.value)}
                className="w-24 px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <span className="text-sm text-ds-textMuted">minutes</span>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={submitting}
            className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
            {submitting ? 'Creating…' : 'Create Test'}
          </button>
          <Link href="/admin/tests"
            className="px-5 py-2 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}

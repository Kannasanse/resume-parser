'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';

const STATUS_COLORS = {
  pending:     'bg-ds-bg text-ds-textMuted border-ds-border',
  in_progress: 'bg-primary/10 text-primary border-primary/30',
  completed:   'bg-ds-successLight text-ds-success border-ds-success/30',
  expired:     'bg-ds-warningLight text-ds-warning border-ds-warning/30',
  revoked:     'bg-ds-dangerLight text-ds-danger border-ds-danger/30',
};

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button onClick={copy} title="Copy link"
      className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors">
      {copied
        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"/></svg>
        : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
      }
    </button>
  );
}

export default function TestLinks() {
  const { id } = useParams();
  const [test, setTest]     = useState(null);
  const [links, setLinks]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [page, setPage]     = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [showGenerate, setShowGenerate] = useState(false);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [testRes, linksRes] = await Promise.all([
        fetch(`/api/v1/admin/tests/${id}`),
        fetch(`/api/v1/admin/tests/${id}/links?page=${page}&limit=${limit}${statusFilter ? `&status=${statusFilter}` : ''}`),
      ]);
      const [testData, linksData] = await Promise.all([testRes.json(), linksRes.json()]);
      setTest(testData.test);
      setLinks(linksData.links || []);
      setTotal(linksData.total || 0);
    } finally {
      setLoading(false);
    }
  }, [id, page, statusFilter]);

  useEffect(() => { load(); }, [load]);

  const revoke = async (lid) => {
    if (!confirm('Revoke this test link? The candidate will no longer be able to access it.')) return;
    await fetch(`/api/v1/admin/tests/${id}/links/${lid}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'revoke' }),
    });
    setLinks(prev => prev.map(l => l.id === lid ? { ...l, status: 'revoked' } : l));
  };

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const testUrl = (token) => `${origin}/test/${token}`;
  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <Link href={`/admin/tests/${id}`} className="text-ds-textMuted hover:text-ds-text transition-colors mt-1">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5"/><path d="m12 5-7 7 7 7"/></svg>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-ds-text font-heading">
              {test ? `${test.title} — Links` : 'Test Links'}
            </h1>
            <p className="text-sm text-ds-textMuted mt-0.5">Manage candidate test access links</p>
          </div>
        </div>
        {test?.status === 'published' && (
          <button onClick={() => setShowGenerate(true)}
            className="bg-primary text-white px-4 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark transition-colors flex-shrink-0">
            + Generate Links
          </button>
        )}
        {test && test.status !== 'published' && (
          <span className="text-xs text-ds-warning bg-ds-warningLight border border-ds-warning/30 px-3 py-1.5 rounded">
            Publish the test to generate links
          </span>
        )}
      </div>

      {/* Status filter */}
      <div className="flex gap-2">
        {['', 'pending', 'in_progress', 'completed', 'expired', 'revoked'].map(s => (
          <button key={s}
            onClick={() => { setStatusFilter(s); setPage(1); }}
            className={`text-xs px-3 py-1.5 rounded border transition-colors capitalize ${
              statusFilter === s
                ? 'border-primary bg-primary/10 text-primary font-medium'
                : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'
            }`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-ds-card border border-ds-border rounded-lg px-4 py-3 flex items-center gap-3">
              <Sk className="h-8 w-8 rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Sk className="h-3.5 w-48" />
                <Sk className="h-3 w-32" />
              </div>
              <Sk className="h-5 w-16 rounded" />
              <Sk className="h-7 w-7 rounded" />
            </div>
          ))}
        </div>
      ) : links.length === 0 ? (
        <div className="text-center py-16 bg-ds-card border border-dashed border-ds-border rounded-lg">
          <p className="text-ds-textMuted text-sm">
            {statusFilter ? `No ${statusFilter} links found.` : 'No links generated yet.'}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2">
            {links.map(link => {
              const attempt = link.test_attempts?.[0];
              return (
                <div key={link.id} className="bg-ds-card border border-ds-border rounded-lg px-4 py-3 hover:border-ds-borderStrong transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-ds-bg border border-ds-border flex items-center justify-center text-xs font-semibold text-ds-textMuted flex-shrink-0">
                      {(link.recipient_name || link.recipient_email)[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-ds-text truncate">
                        {link.recipient_name || link.recipient_email}
                      </p>
                      <p className="text-xs text-ds-textMuted truncate">{link.recipient_email}</p>
                      <div className="flex flex-wrap gap-3 mt-0.5">
                        {attempt?.submitted_at && (
                          <span className="text-xs text-ds-textMuted">
                            Score: <span className="font-medium text-ds-text">
                              {attempt.score !== null ? `${attempt.score}/${attempt.max_score}` : 'Pending grading'}
                            </span>
                          </span>
                        )}
                        {link.expires_at && (
                          <span className="text-xs text-ds-textMuted font-mono">
                            Expires {new Date(link.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded border capitalize ${STATUS_COLORS[link.status] || STATUS_COLORS.pending}`}>
                        {link.status.replace('_', ' ')}
                      </span>
                      {link.status !== 'completed' && link.status !== 'revoked' && (
                        <CopyButton text={testUrl(link.token)} />
                      )}
                      {link.status === 'pending' || link.status === 'in_progress' ? (
                        <button onClick={() => revoke(link.id)}
                          title="Revoke"
                          className="w-7 h-7 flex items-center justify-center rounded border border-ds-border text-ds-textMuted hover:text-ds-danger hover:bg-ds-dangerLight transition-colors">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-ds-textMuted">{total} link{total !== 1 ? 's' : ''}</p>
              <div className="flex gap-2">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                  className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
                  ← Prev
                </button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                  className="text-xs px-3 py-1.5 border border-ds-border rounded-btn text-ds-text disabled:opacity-40 hover:bg-ds-bg transition-colors">
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Generate Links Modal */}
      {showGenerate && (
        <GenerateLinksModal
          testId={id}
          onClose={() => setShowGenerate(false)}
          onGenerated={() => { setShowGenerate(false); load(); }}
        />
      )}
    </div>
  );
}

// ─── Generate Links Modal ─────────────────────────────────────────────────────
function GenerateLinksModal({ testId, onClose, onGenerated }) {
  const [mode, setMode]   = useState('single'); // 'single' | 'bulk'
  const [email, setEmail] = useState('');
  const [name, setName]   = useState('');
  const [bulkText, setBulkText] = useState('');
  const [expiryDays, setExpiryDays] = useState(7);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const parseBulk = () => {
    return bulkText.split('\n')
      .map(line => {
        const [e, n] = line.split(',').map(s => s.trim());
        return e?.includes('@') ? { email: e, name: n || '' } : null;
      })
      .filter(Boolean);
  };

  const submit = async () => {
    setError('');
    const recipients = mode === 'single'
      ? (email.includes('@') ? [{ email: email.trim(), name: name.trim() }] : [])
      : parseBulk();

    if (!recipients.length) { setError('No valid email addresses'); return; }

    setSaving(true);
    try {
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000).toISOString();
      const r = await fetch(`/api/v1/admin/tests/${testId}/links`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipients, expires_at: expiresAt }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed');
      onGenerated(d.links);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-lg shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ds-border">
          <h2 className="font-heading font-bold text-ds-text">Generate Test Links</h2>
          <button onClick={onClose} className="text-ds-textMuted hover:text-ds-text text-xl leading-none">×</button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2">{error}</div>
          )}

          {/* Mode toggle */}
          <div className="flex gap-2">
            {[['single', 'Single recipient'], ['bulk', 'Multiple (CSV)']].map(([val, label]) => (
              <button key={val} type="button" onClick={() => setMode(val)}
                className={`text-xs px-3 py-1.5 rounded border transition-colors ${mode === val ? 'border-primary bg-primary/10 text-primary font-medium' : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
                {label}
              </button>
            ))}
          </div>

          {mode === 'single' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-ds-text mb-1.5">Email <span className="text-ds-danger">*</span></label>
                <input value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="candidate@example.com"
                  className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ds-text mb-1.5">Name</label>
                <input value={name} onChange={e => setName(e.target.value)}
                  placeholder="Candidate name (optional)"
                  className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary placeholder-ds-textMuted" />
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-ds-text mb-1.5">Recipients</label>
              <p className="text-xs text-ds-textMuted mb-2">One per line: <code className="bg-ds-bg px-1 rounded">email, name</code></p>
              <textarea value={bulkText} onChange={e => setBulkText(e.target.value)}
                rows={5}
                placeholder={"alice@example.com, Alice\nbob@example.com, Bob"}
                className="w-full px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary font-mono resize-none placeholder-ds-textMuted" />
              <p className="text-xs text-ds-textMuted mt-1">{parseBulk().length} valid recipient{parseBulk().length !== 1 ? 's' : ''}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-ds-text mb-1.5">Link expiry</label>
            <div className="flex items-center gap-2">
              <input type="number" min="1" max="90" value={expiryDays} onChange={e => setExpiryDays(parseInt(e.target.value) || 7)}
                className="w-20 px-3 py-2 text-sm border border-ds-inputBorder rounded bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary" />
              <span className="text-sm text-ds-textMuted">days</span>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button onClick={submit} disabled={saving}
              className="bg-primary text-white px-5 py-2 rounded-btn text-sm font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {saving ? 'Generating…' : 'Generate'}
            </button>
            <button onClick={onClose}
              className="px-5 py-2 rounded-btn text-sm font-medium text-ds-textMuted border border-ds-border hover:bg-ds-bg transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

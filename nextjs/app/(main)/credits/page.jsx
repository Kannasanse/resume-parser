'use client';
import { useState, useEffect, useCallback } from 'react';

const TYPE_CONFIG = {
  ats_score:        { label: 'ATS Score Analysis', icon: '🎯', color: '#4F46E5', bg: '#EEF2FF' },
  resume_import:    { label: 'Resume Import (AI)',  icon: '📄', color: '#059669', bg: '#ECFDF5' },
  admin_grant:      { label: 'Admin Grant',         icon: '🎁', color: '#D97706', bg: '#FEF3C7' },
  initial_grant:    { label: 'Welcome Credits',     icon: '⭐', color: '#7C3AED', bg: '#F5F3FF' },
  request_approved: { label: 'Credit Request',      icon: '✅', color: '#059669', bg: '#ECFDF5' },
};

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  bg: '#FEF3C7', color: '#D97706' },
  approved: { label: 'Approved', bg: '#ECFDF5', color: '#059669' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#D93025' },
};

function fmt(date) {
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function CreditsPage() {
  const [data, setData] = useState(null);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRequest, setShowRequest] = useState(false);
  const [reqForm, setReqForm] = useState({ amount: 10, reason: '' });
  const [reqSubmitting, setReqSubmitting] = useState(false);
  const [reqMsg, setReqMsg] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [credRes, reqRes] = await Promise.all([
      fetch('/api/v1/credits'),
      fetch('/api/v1/credits/request'),
    ]);
    const [cred, req] = await Promise.all([credRes.json(), reqRes.json()]);
    setData(cred);
    setRequests(req.requests || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const submitRequest = async () => {
    setReqSubmitting(true);
    setReqMsg(null);
    try {
      const res = await fetch('/api/v1/credits/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount_requested: reqForm.amount, reason: reqForm.reason }),
      });
      const json = await res.json();
      if (!res.ok) { setReqMsg({ type: 'error', text: json.error }); return; }
      setReqMsg({ type: 'success', text: 'Request submitted! An admin will review it shortly.' });
      setShowRequest(false);
      load();
    } finally {
      setReqSubmitting(false);
    }
  };

  const pendingRequest = requests.find(r => r.status === 'pending');

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="h-6 w-40 bg-ds-border rounded animate-pulse mb-8" />
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[1,2,3].map(i => <div key={i} className="h-24 bg-ds-border rounded-xl animate-pulse" />)}
      </div>
    </div>
  );

  const balance = data?.balance ?? 0;
  const transactions = data?.transactions || [];
  const totalUsed = transactions.filter(t => t.amount < 0).reduce((s, t) => s + Math.abs(t.amount), 0);
  const totalGranted = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-ds-text">Credits</h1>
          <p className="text-sm text-ds-textMuted mt-0.5">Track your AI feature usage</p>
        </div>
        {!pendingRequest && (
          <button
            onClick={() => setShowRequest(true)}
            className="flex items-center gap-1.5 h-9 px-4 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
          >
            Request Credits
          </button>
        )}
        {pendingRequest && (
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            Request pending review
          </span>
        )}
      </div>

      {reqMsg && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium ${reqMsg.type === 'error' ? 'bg-ds-dangerLight text-ds-danger' : 'bg-ds-successLight text-ds-success'}`}>
          {reqMsg.text}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-ds-card border border-ds-border rounded-xl p-4">
          <div className="text-2xl font-bold text-primary">{balance}</div>
          <div className="text-xs font-semibold text-ds-textMuted mt-1">Available</div>
        </div>
        <div className="bg-ds-card border border-ds-border rounded-xl p-4">
          <div className="text-2xl font-bold text-ds-danger">{totalUsed}</div>
          <div className="text-xs font-semibold text-ds-textMuted mt-1">Used</div>
        </div>
        <div className="bg-ds-card border border-ds-border rounded-xl p-4">
          <div className="text-2xl font-bold text-ds-success">{totalGranted}</div>
          <div className="text-xs font-semibold text-ds-textMuted mt-1">Total Received</div>
        </div>
      </div>

      {/* Credit costs info */}
      <div className="bg-ds-card border border-ds-border rounded-xl p-4 mb-6">
        <div className="text-xs font-bold text-ds-textMuted uppercase tracking-wide mb-3">Credit Costs</div>
        <div className="flex gap-6">
          <div className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 rounded-md flex items-center justify-center text-base" style={{ background: '#EEF2FF' }}>🎯</span>
            <span className="text-ds-textMuted">ATS Score</span>
            <span className="font-bold text-ds-text">3 credits</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="w-6 h-6 rounded-md flex items-center justify-center text-base" style={{ background: '#ECFDF5' }}>📄</span>
            <span className="text-ds-textMuted">Resume Import</span>
            <span className="font-bold text-ds-text">5 credits</span>
          </div>
        </div>
      </div>

      {/* Request history */}
      {requests.length > 0 && (
        <div className="mb-6">
          <div className="text-xs font-bold text-ds-textMuted uppercase tracking-wide mb-3">Credit Requests</div>
          <div className="bg-ds-card border border-ds-border rounded-xl overflow-hidden">
            {requests.map((r, i) => {
              const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
              return (
                <div key={r.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ds-border' : ''}`}>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-ds-text">{r.amount_requested} credits requested</div>
                    {r.reason && <div className="text-xs text-ds-textMuted truncate">{r.reason}</div>}
                    <div className="text-xs text-ds-textMuted">{fmt(r.created_at)}</div>
                  </div>
                  {r.admin_notes && <div className="text-xs text-ds-textMuted italic max-w-[140px] truncate">{r.admin_notes}</div>}
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Transaction history */}
      <div className="text-xs font-bold text-ds-textMuted uppercase tracking-wide mb-3">Usage History</div>
      <div className="bg-ds-card border border-ds-border rounded-xl overflow-hidden">
        {transactions.length === 0 && (
          <div className="py-12 text-center text-ds-textMuted text-sm">No transactions yet</div>
        )}
        {transactions.map((t, i) => {
          const cfg = TYPE_CONFIG[t.type] || { label: t.type, icon: '•', color: '#6B7280', bg: '#F3F4F6' };
          const isDebit = t.amount < 0;
          return (
            <div key={t.id} className={`flex items-center gap-3 px-4 py-3 ${i > 0 ? 'border-t border-ds-border' : ''}`}>
              <span className="w-8 h-8 rounded-lg flex items-center justify-center text-base flex-shrink-0" style={{ background: cfg.bg }}>
                {cfg.icon}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-ds-text">{t.description || cfg.label}</div>
                <div className="text-xs text-ds-textMuted">{fmt(t.created_at)}</div>
              </div>
              <span className={`text-sm font-bold ${isDebit ? 'text-ds-danger' : 'text-ds-success'}`}>
                {isDebit ? '' : '+'}{t.amount}
              </span>
            </div>
          );
        })}
      </div>

      {/* Request modal */}
      {showRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowRequest(false)} />
          <div className="relative bg-ds-card border border-ds-border rounded-2xl shadow-2xl p-6 w-full max-w-md">
            <h3 className="text-base font-bold text-ds-text mb-1">Request Additional Credits</h3>
            <p className="text-sm text-ds-textMuted mb-5">Describe your use case and an admin will review your request.</p>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-semibold text-ds-text block mb-1">Credits requested</label>
                <input
                  type="number" min={1} max={100}
                  value={reqForm.amount}
                  onChange={e => setReqForm(f => ({ ...f, amount: parseInt(e.target.value) || 10 }))}
                  className="w-full px-3 py-2 border border-ds-inputBorder rounded-lg text-sm bg-ds-card text-ds-text focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-ds-text block mb-1">Reason (optional)</label>
                <textarea
                  rows={3}
                  value={reqForm.reason}
                  onChange={e => setReqForm(f => ({ ...f, reason: e.target.value }))}
                  placeholder="Briefly explain why you need additional credits…"
                  className="w-full px-3 py-2 border border-ds-inputBorder rounded-lg text-sm bg-ds-card text-ds-text resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
                />
              </div>
              {reqMsg?.type === 'error' && <p className="text-xs text-ds-danger">{reqMsg.text}</p>}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setShowRequest(false)} className="h-9 px-4 text-sm font-semibold border border-ds-border rounded-lg text-ds-text hover:bg-ds-bg transition-colors">
                  Cancel
                </button>
                <button onClick={submitRequest} disabled={reqSubmitting} className="h-9 px-4 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
                  {reqSubmitting ? 'Submitting…' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';
import { useState, useEffect, useCallback } from 'react';

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

const TX_TYPE_LABELS = {
  ats_score:        'ATS Score Analysis',
  resume_import:    'Resume Import (AI)',
  admin_grant:      'Admin Grant',
  initial_grant:    'Welcome Credits',
  request_approved: 'Request Approved',
};

function TxAmount({ amount }) {
  const positive = amount > 0;
  return (
    <span style={{ color: positive ? '#059669' : '#D93025', fontWeight: 600 }}>
      {positive ? '+' : ''}{amount}
    </span>
  );
}

const STATUS_CONFIG = {
  pending:  { label: 'Pending',  bg: '#FEF3C7', color: '#D97706', border: '#FDE68A' },
  approved: { label: 'Approved', bg: '#ECFDF5', color: '#059669', border: '#BBF7D0' },
  rejected: { label: 'Rejected', bg: '#FEE2E2', color: '#D93025', border: '#FECACA' },
};

function GrantModal({ user, onClose, onDone }) {
  const [amount, setAmount] = useState(10);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setSubmitting(true);
    setErr('');
    try {
      const res = await fetch('/api/v1/admin/credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, amount, description }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error); return; }
      onDone(`Granted ${amount} credits to ${user.first_name || user.email}. New balance: ${json.new_balance}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-ds-text mb-1">Grant Credits</h3>
        <p className="text-sm text-ds-textMuted mb-4">To: <strong>{user.first_name} {user.last_name}</strong> ({user.email})</p>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs font-semibold text-ds-text block mb-1">Amount</label>
            <input type="number" min={1} max={500} value={amount}
              onChange={e => setAmount(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-ds-inputBorder rounded-lg text-sm bg-ds-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-ds-text block mb-1">Note (optional)</label>
            <input value={description} onChange={e => setDescription(e.target.value)}
              placeholder="e.g. Extra credits for demo"
              className="w-full px-3 py-2 border border-ds-inputBorder rounded-lg text-sm bg-ds-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
          {err && <p className="text-xs text-ds-danger">{err}</p>}
          <div className="flex gap-2 justify-end">
            <button onClick={onClose} className="h-9 px-4 text-sm font-semibold border border-ds-border rounded-lg text-ds-text hover:bg-ds-bg transition-colors">Cancel</button>
            <button onClick={submit} disabled={submitting || amount < 1}
              className="h-9 px-4 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
              {submitting ? 'Granting…' : 'Grant Credits'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ReviewModal({ req, onClose, onDone }) {
  const [action, setAction] = useState('approve');
  const [amountOverride, setAmountOverride] = useState(req.amount_requested);
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const submit = async () => {
    setSubmitting(true);
    setErr('');
    try {
      const res = await fetch(`/api/v1/admin/credits/requests/${req.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, admin_notes: adminNotes, amount_override: action === 'approve' ? amountOverride : undefined }),
      });
      const json = await res.json();
      if (!res.ok) { setErr(json.error); return; }
      onDone(action === 'approve' ? `Approved: granted ${amountOverride} credits.` : 'Request rejected.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-ds-card border border-ds-border rounded-2xl shadow-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-ds-text mb-1">Review Request</h3>
        <p className="text-sm text-ds-textMuted mb-1">
          From: <strong>{req.profiles?.first_name} {req.profiles?.last_name}</strong>
        </p>
        {req.reason && <p className="text-xs text-ds-textMuted mb-4 bg-ds-bg rounded-lg px-3 py-2 italic">"{req.reason}"</p>}
        <div className="flex gap-2 mb-4">
          {['approve', 'reject'].map(a => (
            <button key={a} onClick={() => setAction(a)}
              className={`flex-1 h-9 text-sm font-semibold rounded-lg border transition-colors capitalize
                ${action === a
                  ? a === 'approve' ? 'bg-ds-success text-white border-ds-success' : 'bg-ds-danger text-white border-ds-danger'
                  : 'border-ds-border text-ds-textMuted hover:bg-ds-bg'}`}>
              {a}
            </button>
          ))}
        </div>
        {action === 'approve' && (
          <div className="mb-3">
            <label className="text-xs font-semibold text-ds-text block mb-1">Credits to grant</label>
            <input type="number" min={1} max={500} value={amountOverride}
              onChange={e => setAmountOverride(parseInt(e.target.value) || req.amount_requested)}
              className="w-full px-3 py-2 border border-ds-inputBorder rounded-lg text-sm bg-ds-card focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
          </div>
        )}
        <div className="mb-4">
          <label className="text-xs font-semibold text-ds-text block mb-1">Admin note (optional)</label>
          <textarea rows={2} value={adminNotes} onChange={e => setAdminNotes(e.target.value)}
            placeholder="Visible to user…"
            className="w-full px-3 py-2 border border-ds-inputBorder rounded-lg text-sm bg-ds-card resize-none focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
          />
        </div>
        {err && <p className="text-xs text-ds-danger mb-2">{err}</p>}
        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="h-9 px-4 text-sm font-semibold border border-ds-border rounded-lg text-ds-text hover:bg-ds-bg transition-colors">Cancel</button>
          <button onClick={submit} disabled={submitting}
            className="h-9 px-4 text-sm font-semibold bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-60">
            {submitting ? 'Saving…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AdminCreditsPage() {
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txTotal, setTxTotal] = useState(0);
  const [txPage, setTxPage] = useState(1);
  const [txUserFilter, setTxUserFilter] = useState('');
  const [reqFilter, setReqFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [txLoading, setTxLoading] = useState(false);
  const [grantTarget, setGrantTarget] = useState(null);
  const [reviewTarget, setReviewTarget] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('requests');

  const load = useCallback(async () => {
    setLoading(true);
    const [uRes, rRes] = await Promise.all([
      fetch('/api/v1/admin/credits'),
      fetch(`/api/v1/admin/credits/requests?status=${reqFilter}`),
    ]);
    const [u, r] = await Promise.all([uRes.json(), rRes.json()]);
    setUsers(u.users || []);
    setRequests(r.requests || []);
    setLoading(false);
  }, [reqFilter]);

  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    const params = new URLSearchParams({ page: txPage });
    if (txUserFilter) params.set('user_id', txUserFilter);
    const res = await fetch(`/api/v1/admin/credits/transactions?${params}`);
    const json = await res.json();
    setTransactions(json.transactions || []);
    setTxTotal(json.total || 0);
    setTxLoading(false);
  }, [txPage, txUserFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (activeTab === 'history') loadTransactions(); }, [activeTab, loadTransactions]);

  const handleDone = (msg) => {
    setSuccessMsg(msg);
    setGrantTarget(null);
    setReviewTarget(null);
    load();
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const pendingCount = requests.filter(r => r.status === 'pending').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-ds-text">Credits Management</h1>
        <p className="text-sm text-ds-textMuted mt-0.5">Manage user credits and review requests</p>
      </div>

      {successMsg && (
        <div className="mb-4 p-3 rounded-lg bg-ds-successLight text-ds-success text-sm font-medium">{successMsg}</div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-ds-border mb-6">
        {[
          { id: 'requests', label: `Requests${pendingCount > 0 ? ` (${pendingCount})` : ''}` },
          { id: 'users',    label: 'All Users' },
          { id: 'history',  label: 'Usage History' },
        ].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors
              ${activeTab === t.id ? 'text-primary border-primary' : 'text-ds-textMuted border-transparent hover:text-ds-text'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Requests tab */}
      {activeTab === 'requests' && (
        <div>
          <div className="flex gap-2 mb-4">
            {['pending', 'approved', 'rejected', 'all'].map(s => (
              <button key={s} onClick={() => setReqFilter(s)}
                className={`h-7 px-3 text-xs font-semibold rounded-full border transition-colors capitalize
                  ${reqFilter === s ? 'bg-primary text-white border-primary' : 'border-ds-border text-ds-textMuted hover:text-ds-text hover:bg-ds-bg'}`}>
                {s}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 bg-ds-border rounded-xl animate-pulse" />)}</div>
          ) : requests.length === 0 ? (
            <div className="py-16 text-center text-ds-textMuted text-sm">No {reqFilter !== 'all' ? reqFilter : ''} requests</div>
          ) : (
            <div className="bg-ds-card border border-ds-border rounded-xl overflow-hidden">
              {requests.map((r, i) => {
                const sc = STATUS_CONFIG[r.status] || STATUS_CONFIG.pending;
                return (
                  <div key={r.id} className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? 'border-t border-ds-border' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-ds-text">
                          {r.profiles?.first_name} {r.profiles?.last_name}
                        </span>
                        <span className="text-xs text-ds-textMuted">{r.profiles?.email}</span>
                      </div>
                      <div className="text-xs text-ds-textMuted mt-0.5">
                        Requested <strong>{r.amount_requested} credits</strong> · {fmt(r.created_at)}
                        {r.reason && <span className="italic ml-1">— "{r.reason}"</span>}
                      </div>
                      {r.admin_notes && <div className="text-xs text-ds-textMuted mt-0.5 italic">Note: {r.admin_notes}</div>}
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border flex-shrink-0"
                      style={{ background: sc.bg, color: sc.color, borderColor: sc.border }}>
                      {sc.label}
                    </span>
                    {r.status === 'pending' && (
                      <button onClick={() => setReviewTarget(r)}
                        className="h-8 px-3 text-xs font-semibold border border-ds-border rounded-lg text-ds-text hover:bg-ds-bg transition-colors flex-shrink-0">
                        Review
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Users tab */}
      {activeTab === 'users' && (
        <div className="bg-ds-card border border-ds-border rounded-xl overflow-hidden">
          <table className="ds-table">
            <thead>
              <tr className="border-b border-ds-border bg-ds-bg">
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted">Role</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-ds-textMuted">Balance</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-ds-textMuted">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading
                ? Array.from({length:5}).map((_,i) => (
                    <tr key={i}><td colSpan={4} className="px-4 py-3"><div className="h-4 bg-ds-border rounded animate-pulse" /></td></tr>
                  ))
                : users.map((u, i) => (
                    <tr key={u.id} className={`${i > 0 ? 'border-t border-ds-border' : ''} hover:bg-ds-bg transition-colors`}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-ds-text">{u.first_name} {u.last_name}</div>
                        <div className="text-xs text-ds-textMuted">{u.email}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-50 text-purple-700' : 'bg-ds-bg text-ds-textMuted'}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {u.balance === null
                          ? <span className="text-xs text-ds-textMuted">Not initialized</span>
                          : <span className={`font-bold ${u.balance < 5 ? 'text-ds-danger' : 'text-ds-success'}`}>{u.balance}</span>
                        }
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button onClick={() => setGrantTarget(u)}
                          className="h-7 px-3 text-xs font-semibold border border-ds-border rounded-lg text-ds-text hover:bg-ds-bg transition-colors">
                          Grant Credits
                        </button>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>
      )}

      {/* Usage History tab */}
      {activeTab === 'history' && (
        <div>
          {/* User filter */}
          <div className="flex gap-3 items-center mb-4">
            <select
              value={txUserFilter}
              onChange={e => { setTxUserFilter(e.target.value); setTxPage(1); }}
              className="h-8 px-3 text-xs border border-ds-border rounded-lg bg-ds-card text-ds-text focus:outline-none focus:border-primary"
            >
              <option value="">All users</option>
              {users.map(u => (
                <option key={u.id} value={u.id}>{u.first_name} {u.last_name} ({u.email})</option>
              ))}
            </select>
            <span className="text-xs text-ds-textMuted">{txTotal} total transactions</span>
          </div>

          <div className="bg-ds-card border border-ds-border rounded-xl overflow-hidden">
            <table className="ds-table">
              <thead>
                <tr className="border-b border-ds-border bg-ds-bg">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted">Description</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ds-textMuted">Credits</th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-ds-textMuted">Date</th>
                </tr>
              </thead>
              <tbody>
                {txLoading
                  ? Array.from({length: 8}).map((_, i) => (
                      <tr key={i}><td colSpan={5} className="px-4 py-3"><div className="h-4 bg-ds-border rounded animate-pulse" /></td></tr>
                    ))
                  : transactions.length === 0
                    ? <tr><td colSpan={5} className="px-4 py-16 text-center text-ds-textMuted text-sm">No transactions found</td></tr>
                    : transactions.map((tx, i) => (
                        <tr key={tx.id} className={`${i > 0 ? 'border-t border-ds-border' : ''} hover:bg-ds-bg transition-colors`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-ds-text text-xs">{tx.profiles?.first_name} {tx.profiles?.last_name}</div>
                            <div className="text-xs text-ds-textMuted">{tx.profiles?.email}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-xs font-medium text-ds-text">{TX_TYPE_LABELS[tx.type] || tx.type}</span>
                          </td>
                          <td className="px-4 py-3 text-xs text-ds-textMuted max-w-xs truncate">{tx.description || '—'}</td>
                          <td className="px-4 py-3 text-right text-sm"><TxAmount amount={tx.amount} /></td>
                          <td className="px-4 py-3 text-right text-xs text-ds-textMuted whitespace-nowrap">{fmtTime(tx.created_at)}</td>
                        </tr>
                      ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {txTotal > 50 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                onClick={() => setTxPage(p => Math.max(1, p - 1))}
                disabled={txPage === 1}
                className="h-8 px-3 text-xs font-semibold border border-ds-border rounded-lg text-ds-text hover:bg-ds-bg disabled:opacity-40 transition-colors">
                Previous
              </button>
              <span className="h-8 px-3 text-xs flex items-center text-ds-textMuted">
                Page {txPage} of {Math.ceil(txTotal / 50)}
              </span>
              <button
                onClick={() => setTxPage(p => p + 1)}
                disabled={txPage >= Math.ceil(txTotal / 50)}
                className="h-8 px-3 text-xs font-semibold border border-ds-border rounded-lg text-ds-text hover:bg-ds-bg disabled:opacity-40 transition-colors">
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {grantTarget  && <GrantModal  user={grantTarget}  onClose={() => setGrantTarget(null)}  onDone={handleDone} />}
      {reviewTarget && <ReviewModal req={reviewTarget}  onClose={() => setReviewTarget(null)} onDone={handleDone} />}
    </div>
  );
}

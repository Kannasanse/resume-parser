'use client';
import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';
import { useAuth } from '@/hooks/useAuth';

// ─── Shared helpers ───────────────────────────────────────────────────────────
const STATUS_COLORS = {
  active:      'bg-ds-successLight text-ds-success',
  pending:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  deactivated: 'bg-ds-dangerLight text-ds-danger',
};
const DIFF_COLORS = {
  easy:   'bg-green-50 text-green-700 border-green-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  hard:   'bg-red-50 text-red-700 border-red-200',
};
const MODE_LABELS = {
  skills:  'Assess by Skill',
  content: 'Assess by Content',
  jd:      'Assess by JD',
};
const TEMPLATE_NAMES = {
  'classic-professional': 'Classic Professional',
  'modern-slate': 'Modern Slate',
  'minimal-white': 'Minimal White',
  'ats-clean': 'ATS Clean',
  'creative-edge': 'Creative Edge',
  'executive-navy': 'Executive Navy',
  'tech-stack': 'Tech Stack',
  'soft-gradient': 'Soft Gradient',
  'bold-impact': 'Bold Impact',
  'elegant-script': 'Elegant Script',
  'heritage': 'Heritage',
  'corporate-serif': 'Corporate',
  'silver-banner': 'Silver Banner',
  'teal-sidebar': 'Teal Sidebar',
  'timeline': 'Timeline',
  'photo-sidebar': 'Photo Sidebar',
  'beacon': 'Beacon',
  'banded': 'Banded',
  'foundry': 'Foundry',
};

const EVENT_LABELS = {
  user_updated:         'Account updated',
  user_deleted:         'Account deleted',
  user_invited:         'Invitation sent',
  invite_resent:        'Invitation resent',
  invite_cancelled:     'Invitation cancelled',
  password_reset_sent:  'Password reset sent',
  user_name_updated:    'Name updated',
  role_changed:         'Role changed',
};

function fmt(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function SortIcon({ col, active, dir }) {
  if (!active) return <span className="ml-1 text-ds-textMuted opacity-40">↕</span>;
  return <span className="ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
}

function FilterChip({ label, onRemove }) {
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium">
      {label}
      <button onClick={onRemove} className="opacity-60 hover:opacity-100 leading-none ml-0.5">×</button>
    </span>
  );
}

function readiness(pct) {
  if (pct === null) return null;
  if (pct >= 80) return { label: 'Strong Match',     cls: 'bg-ds-successLight text-ds-success' };
  if (pct >= 50) return { label: 'Partial Match',    cls: 'bg-amber-50 text-amber-700' };
  return           { label: 'Needs Improvement', cls: 'bg-ds-dangerLight text-ds-danger' };
}

function UserAvatar({ src, initials, size = 80 }) {
  if (src) {
    return (
      <img
        src={src}
        alt={initials}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border-2 border-ds-border flex-shrink-0"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.35 }}
      className="rounded-full bg-primary/10 border-2 border-ds-border flex items-center justify-center font-bold text-primary select-none flex-shrink-0"
    >
      {initials}
    </div>
  );
}

// ─── Auth Events Log ──────────────────────────────────────────────────────────
function AuthEventsLog({ events, invites, loading }) {
  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-10 w-full" />)}
      </div>
    );
  }
  if (!events.length && !invites.length) {
    return <p className="text-sm text-ds-textMuted py-4 text-center">No auth events recorded yet.</p>;
  }

  // Merge events and invite events into a unified timeline
  const inviteEvents = invites.map(inv => ({
    id: `inv-${inv.id}`,
    action: inv.used_at ? 'invite_used' : inv.status === 'cancelled' ? 'invite_cancelled' : 'invite_pending',
    created_at: inv.created_at,
    details: { expires_at: inv.expires_at, used_at: inv.used_at, status: inv.status },
  }));

  const all = [...events, ...inviteEvents].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  const eventIcon = (action) => {
    if (action.includes('invite'))         return '✉';
    if (action.includes('password'))       return '🔑';
    if (action.includes('deleted'))        return '🗑';
    if (action.includes('name'))           return '✏';
    if (action.includes('role'))           return '🛡';
    return '⚙';
  };

  return (
    <div className="space-y-1">
      {all.map(ev => (
        <div key={ev.id} className="flex items-start gap-3 py-2.5 border-b border-ds-border last:border-0">
          <span className="text-base mt-0.5 flex-shrink-0">{eventIcon(ev.action)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-ds-text font-medium">
              {EVENT_LABELS[ev.action] || ev.action.replace(/_/g, ' ')}
            </p>
            {ev.details && Object.keys(ev.details).length > 0 && (
              <p className="text-xs text-ds-textMuted truncate">
                {ev.action === 'user_name_updated'
                  ? `${ev.details.first_name || ''} ${ev.details.last_name || ''}`.trim()
                  : ev.action === 'user_updated' && ev.details.role
                    ? `Role → ${ev.details.role}`
                    : ev.action === 'user_updated' && ev.details.status
                      ? `Status → ${ev.details.status}`
                      : ev.details.expires_at
                        ? `Expires ${fmtDate(ev.details.expires_at)}`
                        : null}
              </p>
            )}
          </div>
          <span className="text-xs text-ds-textMuted whitespace-nowrap flex-shrink-0">{fmt(ev.created_at)}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Self-Tests Tab (UM-001) ──────────────────────────────────────────────────
function SelfTestsTab({ userId, userName }) {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [sort, setSort]         = useState('created_at');
  const [dir, setDir]           = useState('desc');
  const [modeFilter, setModeFilter] = useState('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [dateError, setDateError] = useState('');
  const LIMIT = 20;

  const load = useCallback(async (p = page) => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams({
        page: p, limit: LIMIT, sort, dir,
        ...(modeFilter !== 'all' && { mode: modeFilter }),
        ...(fromDate && { from: fromDate }),
        ...(toDate   && { to: toDate }),
      });
      const r = await fetch(`/api/v1/admin/users/${userId}/self-tests?${qs}`);
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to load.'); return; }
      setData(d.sessions || []);
      setTotal(d.total || 0);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, [userId, page, sort, dir, modeFilter, fromDate, toDate]);

  useEffect(() => { load(page); }, [page, sort, dir]);

  const applyFilters = () => {
    if (fromDate && toDate && fromDate > toDate) { setDateError('From date cannot be later than To date.'); return; }
    setDateError(''); setPage(1); load(1);
  };
  const clearFilters = () => { setModeFilter('all'); setFromDate(''); setToDate(''); setDateError(''); setPage(1); load(1); };
  const handleSort = (col) => { if (sort === col) setDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSort(col); setDir('desc'); } };

  const activeFilters = [
    modeFilter !== 'all' && { key: 'mode', label: MODE_LABELS[modeFilter] || modeFilter, clear: () => { setModeFilter('all'); setPage(1); load(1); } },
    fromDate && { key: 'from', label: `From ${fmtDate(fromDate)}`, clear: () => { setFromDate(''); setPage(1); load(1); } },
    toDate   && { key: 'to',   label: `To ${fmtDate(toDate)}`,     clear: () => { setToDate('');   setPage(1); load(1); } },
  ].filter(Boolean);

  const totalPages = Math.ceil(total / LIMIT);
  const TH = ({ col, label, right }) => (
    <th onClick={() => handleSort(col)}
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ds-textMuted cursor-pointer select-none hover:text-ds-text whitespace-nowrap ${right ? 'text-right' : 'text-left'} ${loading ? 'pointer-events-none opacity-60' : ''}`}>
      {label}<SortIcon col={col} active={sort === col} dir={dir} />
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="bg-ds-card border border-ds-border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-ds-textMuted mb-1">Mode</label>
            <select value={modeFilter} onChange={e => setModeFilter(e.target.value)} disabled={loading}
              className="border border-ds-inputBorder rounded px-2 py-1.5 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
              <option value="all">All Modes</option>
              <option value="skills">Assess by Skill</option>
              <option value="content">Assess by Content</option>
              <option value="jd">Assess by JD</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-ds-textMuted mb-1">From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} disabled={loading}
              className="border border-ds-inputBorder rounded px-2 py-1.5 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ds-textMuted mb-1">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} disabled={loading}
              className="border border-ds-inputBorder rounded px-2 py-1.5 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
          </div>
          <button onClick={applyFilters} disabled={loading}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-btn font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">Apply</button>
          <button onClick={clearFilters} disabled={loading}
            className="px-3 py-1.5 text-sm text-ds-textMuted border border-ds-border rounded-btn hover:bg-ds-bg disabled:opacity-50 transition-colors">Clear</button>
        </div>
        {dateError && <p className="text-xs text-ds-danger">{dateError}</p>}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">{activeFilters.map(f => <FilterChip key={f.key} label={f.label} onRemove={f.clear} />)}</div>
        )}
      </div>
      <p className="text-sm text-ds-textMuted">{loading ? 'Loading…' : `${total} interview prep session${total !== 1 ? 's' : ''} found`}</p>
      {error && (
        <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2.5 flex items-center justify-between">
          <span>{error}</span><button onClick={() => load(page)} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}
      <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Sk key={i} className="h-10 w-full" />)}</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-sm text-ds-textMuted">
            {activeFilters.length > 0 ? <>No sessions match the selected filters. <button onClick={clearFilters} className="text-primary hover:underline">Clear Filters</button></> : 'This user has not taken any interview prep sessions yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ds-bg border-b border-ds-border">
                <tr>
                  <TH col="input_type" label="Mode" />
                  <TH col="created_at" label="Date & Time" />
                  <TH col="question_count" label="Questions" />
                  <TH col="pct" label="Score" right />
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ds-textMuted text-left whitespace-nowrap">Readiness</th>
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ds-textMuted text-left whitespace-nowrap">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border">
                {data.map(s => {
                  const r = s.input_type === 'jd' ? readiness(s.pct) : null;
                  return (
                    <tr key={s.id}
                      onClick={() => window.location.href = `/admin/users/${userId}/self-tests/${s.id}?back=${encodeURIComponent(`/admin/users/${userId}?tab=self-tests`)}`}
                      className="hover:bg-ds-bg cursor-pointer transition-colors">
                      <td className="px-3 py-2.5 whitespace-nowrap">
                        <span className="text-xs font-medium">{MODE_LABELS[s.input_type] || s.input_type}</span>
                        {s.difficulty && <span className={`ml-1.5 text-[10px] font-semibold px-1.5 py-0.5 rounded border ${DIFF_COLORS[s.difficulty]}`}>{s.difficulty}</span>}
                      </td>
                      <td className="px-3 py-2.5 text-ds-textMuted whitespace-nowrap">{fmt(s.created_at)}</td>
                      <td className="px-3 py-2.5 text-center">{s.question_count}</td>
                      <td className="px-3 py-2.5 text-right font-mono">{s.pct !== null ? `${s.pct}%` : <span className="text-ds-textMuted">—</span>}</td>
                      <td className="px-3 py-2.5">{r ? <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.cls}`}>{r.label}</span> : <span className="text-ds-textMuted">—</span>}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.status === 'completed' ? 'bg-ds-successLight text-ds-success' : 'bg-ds-bg text-ds-textMuted border border-ds-border'}`}>
                          {s.status === 'completed' ? 'Completed' : 'Abandoned'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-ds-textMuted">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || loading} className="px-3 py-1.5 rounded border border-ds-border text-ds-textMuted hover:bg-ds-bg disabled:opacity-40 transition-colors">← Prev</button>
            <span className="px-3 py-1.5 text-ds-textMuted">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages || loading} className="px-3 py-1.5 rounded border border-ds-border text-ds-textMuted hover:bg-ds-bg disabled:opacity-40 transition-colors">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Resumes Tab (UM-003) ─────────────────────────────────────────────────────
function ResumesTab({ userId }) {
  const [data, setData]         = useState([]);
  const [total, setTotal]       = useState(0);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [page, setPage]         = useState(1);
  const [sort, setSort]         = useState('updated_at');
  const [dir, setDir]           = useState('desc');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate]     = useState('');
  const [dateError, setDateError] = useState('');
  const LIMIT = 20;

  const load = useCallback(async (p = page) => {
    setLoading(true); setError('');
    try {
      const qs = new URLSearchParams({ page: p, limit: LIMIT, sort, dir, ...(fromDate && { from: fromDate }), ...(toDate && { to: toDate }) });
      const r = await fetch(`/api/v1/admin/users/${userId}/resumes?${qs}`);
      const d = await r.json();
      if (!r.ok) { setError(d.error || 'Failed to load.'); return; }
      setData(d.resumes || []); setTotal(d.total || 0);
    } catch { setError('Network error. Please try again.'); }
    finally { setLoading(false); }
  }, [userId, page, sort, dir, fromDate, toDate]);

  useEffect(() => { load(page); }, [page, sort, dir]);

  const applyFilters = () => {
    if (fromDate && toDate && fromDate > toDate) { setDateError('From date cannot be later than To date.'); return; }
    setDateError(''); setPage(1); load(1);
  };
  const clearFilters = () => { setFromDate(''); setToDate(''); setDateError(''); setPage(1); load(1); };
  const handleSort = (col) => { if (sort === col) setDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSort(col); setDir('desc'); } };

  const activeFilters = [
    fromDate && { key: 'from', label: `From ${fmtDate(fromDate)}`, clear: () => { setFromDate(''); setPage(1); load(1); } },
    toDate   && { key: 'to',   label: `To ${fmtDate(toDate)}`,     clear: () => { setToDate('');   setPage(1); load(1); } },
  ].filter(Boolean);

  const totalPages = Math.ceil(total / LIMIT);
  const TH = ({ col, label, right, hidden }) => (
    <th onClick={() => handleSort(col)}
      className={`px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ds-textMuted cursor-pointer select-none hover:text-ds-text whitespace-nowrap ${right ? 'text-right' : 'text-left'} ${hidden ? 'hidden md:table-cell' : ''} ${loading ? 'pointer-events-none opacity-60' : ''}`}>
      {label}<SortIcon col={col} active={sort === col} dir={dir} />
    </th>
  );

  return (
    <div className="space-y-4">
      <div className="bg-ds-card border border-ds-border rounded-lg p-4 space-y-3">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-ds-textMuted mb-1">Created From</label>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} disabled={loading}
              className="border border-ds-inputBorder rounded px-2 py-1.5 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-ds-textMuted mb-1">To</label>
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} disabled={loading}
              className="border border-ds-inputBorder rounded px-2 py-1.5 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50" />
          </div>
          <button onClick={applyFilters} disabled={loading}
            className="px-3 py-1.5 text-sm bg-primary text-white rounded-btn font-medium hover:bg-primary-dark disabled:opacity-50 transition-colors">Apply</button>
          <button onClick={clearFilters} disabled={loading}
            className="px-3 py-1.5 text-sm text-ds-textMuted border border-ds-border rounded-btn hover:bg-ds-bg disabled:opacity-50 transition-colors">Clear</button>
        </div>
        {dateError && <p className="text-xs text-ds-danger">{dateError}</p>}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap gap-2">{activeFilters.map(f => <FilterChip key={f.key} label={f.label} onRemove={f.clear} />)}</div>
        )}
      </div>
      <p className="text-sm text-ds-textMuted">{loading ? 'Loading…' : `${total} resume${total !== 1 ? 's' : ''} found`}</p>
      {error && (
        <div className="bg-ds-dangerLight border border-ds-danger/30 text-ds-danger text-sm rounded px-3 py-2.5 flex items-center justify-between">
          <span>{error}</span><button onClick={() => load(page)} className="text-xs font-semibold underline">Retry</button>
        </div>
      )}
      <div className="bg-ds-card border border-ds-border rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-4 space-y-2">{Array.from({ length: 5 }).map((_, i) => <Sk key={i} className="h-10 w-full" />)}</div>
        ) : data.length === 0 ? (
          <div className="py-12 text-center text-sm text-ds-textMuted">
            {activeFilters.length > 0 ? <>No resumes match the selected filters. <button onClick={clearFilters} className="text-primary hover:underline">Clear Filters</button></> : 'This user has not created any resumes yet.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ds-bg border-b border-ds-border">
                <tr>
                  <TH col="title"      label="Title" />
                  <TH col="template"   label="Template" hidden />
                  <th className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ds-textMuted text-left whitespace-nowrap">Status</th>
                  <TH col="created_at" label="Created" hidden />
                  <TH col="updated_at" label="Last Modified" />
                  <TH col="sections"   label="Sections" hidden />
                </tr>
              </thead>
              <tbody className="divide-y divide-ds-border">
                {data.map(r => (
                  <tr key={r.id}
                    onClick={() => window.location.href = `/admin/users/${userId}/resumes/${r.id}?back=${encodeURIComponent(`/admin/users/${userId}?tab=resumes`)}`}
                    className="hover:bg-ds-bg cursor-pointer transition-colors">
                    <td className="px-3 py-2.5 font-medium text-ds-text max-w-[200px] truncate">{r.title}</td>
                    <td className="px-3 py-2.5 text-ds-textMuted whitespace-nowrap hidden md:table-cell">{TEMPLATE_NAMES[r.template_id] || r.template_id || <span className="italic">—</span>}</td>
                    <td className="px-3 py-2.5"><span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-ds-bg text-ds-textMuted border border-ds-border">Draft</span></td>
                    <td className="px-3 py-2.5 text-ds-textMuted whitespace-nowrap hidden md:table-cell">{fmtDate(r.created_at)}</td>
                    <td className="px-3 py-2.5 text-ds-textMuted whitespace-nowrap">{fmt(r.updated_at)}</td>
                    <td className="px-3 py-2.5 text-center text-ds-textMuted hidden md:table-cell">{r.section_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-ds-textMuted">Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage(p => p - 1)} disabled={page === 1 || loading} className="px-3 py-1.5 rounded border border-ds-border text-ds-textMuted hover:bg-ds-bg disabled:opacity-40 transition-colors">← Prev</button>
            <span className="px-3 py-1.5 text-ds-textMuted">{page} / {totalPages}</span>
            <button onClick={() => setPage(p => p + 1)} disabled={page === totalPages || loading} className="px-3 py-1.5 rounded border border-ds-border text-ds-textMuted hover:bg-ds-bg disabled:opacity-40 transition-colors">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [user, setUser]           = useState(null);
  const [events, setEvents]       = useState([]);
  const [invites, setInvites]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [saving, setSaving]       = useState(false);
  const [deleting, setDeleting]   = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [role, setRole]           = useState('user');
  const [status, setStatus]       = useState('active');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName]   = useState('');
  const [nameError, setNameError] = useState('');
  const [nameSaving, setNameSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('account');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const tab = new URLSearchParams(window.location.search).get('tab');
      if (['account', 'self-tests', 'resumes'].includes(tab)) setActiveTab(tab);
    }
  }, []);

  // Load basic user info
  useEffect(() => {
    fetch(`/api/v1/admin/users/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setRole(data.user.role);
          setStatus(data.user.status);
          setFirstName(data.user.first_name || '');
          setLastName(data.user.last_name || '');
        }
      })
      .catch(() => setError('Failed to load user.'))
      .finally(() => setLoading(false));
  }, [id]);

  // Load events + avatar + invites from actions endpoint
  useEffect(() => {
    setEventsLoading(true);
    fetch(`/api/v1/admin/users/${id}/actions`)
      .then(r => r.json())
      .then(data => {
        if (data.profile?.avatar_url) {
          setUser(u => u ? { ...u, avatar_url: data.profile.avatar_url } : u);
        }
        setEvents(data.events || []);
        setInvites(data.invites || []);
      })
      .catch(() => {})
      .finally(() => setEventsLoading(false));
  }, [id]);

  const handleSavePermissions = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, status }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Update failed.'); return; }
      setSuccess('Permissions updated.');
      setUser(u => ({ ...u, role, status }));
    } catch { setError('Update failed. Please try again.'); }
    finally { setSaving(false); }
  };

  const handleSaveName = async () => {
    if (!firstName.trim()) { setNameError('First name is required.'); return; }
    setNameError(''); setNameSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/v1/admin/users/${id}/actions`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ first_name: firstName.trim(), last_name: lastName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Update failed.'); return; }
      setSuccess('Name updated.');
      setUser(u => ({ ...u, first_name: firstName.trim(), last_name: lastName.trim() }));
      // Refresh events log
      fetch(`/api/v1/admin/users/${id}/actions`).then(r => r.json()).then(d => { setEvents(d.events || []); setInvites(d.invites || []); });
    } catch { setError('Update failed.'); }
    finally { setNameSaving(false); }
  };

  const handleUnlock = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked_until: null, failed_login_attempts: 0 }),
      });
      if (!res.ok) { setError('Unlock failed.'); return; }
      setSuccess('Account unlocked.');
      setUser(u => ({ ...u, locked_until: null, failed_login_attempts: 0 }));
    } catch { setError('Unlock failed.'); }
    finally { setSaving(false); }
  };

  const handleAction = async (action, label) => {
    setActionLoading(action); setError(''); setSuccess('');
    try {
      const res = await fetch(`/api/v1/admin/users/${id}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || `${label} failed.`); return; }
      setSuccess(data.message || `${label} sent.`);
      // Refresh events
      fetch(`/api/v1/admin/users/${id}/actions`).then(r => r.json()).then(d => { setEvents(d.events || []); setInvites(d.invites || []); });
    } catch { setError(`${label} failed.`); }
    finally { setActionLoading(''); }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Delete failed.'); setDeleting(false); return; }
      router.push('/admin/users');
    } catch { setError('Delete failed.'); setDeleting(false); }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Sk className="h-7 w-48" />
        <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Sk key={i} className="h-10 w-full" />)}
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-ds-text font-medium">User not found.</p>
        <Link href="/admin/users" className="text-primary hover:underline text-sm mt-2 block">← Back to User Management</Link>
      </div>
    );
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
  const initials = displayName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || 'AU';
  const isLocked  = user.locked_until && new Date(user.locked_until) > new Date();
  const isSelf    = currentUser?.id === id;
  const isPending = user.status === 'pending';

  const TABS = [
    { id: 'account',    label: 'Account' },
    { id: 'self-tests', label: 'Interview Prep' },
    { id: 'resumes',    label: 'Resumes' },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-3 flex-wrap">
        <Link href="/admin/users" className="text-ds-textMuted hover:text-ds-text text-sm">← Users</Link>
        <span className="text-ds-border">/</span>
        <h1 className="text-xl font-bold text-ds-text font-heading">{displayName}</h1>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[user.status] || 'bg-ds-bg text-ds-textMuted'}`}>{user.status}</span>
      </div>

      {error   && <p className="text-sm text-ds-danger bg-ds-dangerLight rounded px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-ds-success bg-ds-successLight rounded px-3 py-2">{success}</p>}

      {/* Tab bar */}
      <div className="border-b border-ds-border overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px ${activeTab === t.id ? 'border-primary text-primary' : 'border-transparent text-ds-textMuted hover:text-ds-text hover:border-ds-border'}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Account tab ── */}
      {activeTab === 'account' && (
        <div className="space-y-5 max-w-2xl">

          {/* Profile picture + identity */}
          <div className="bg-ds-card border border-ds-border rounded-lg p-6">
            <div className="flex items-center gap-5">
              <UserAvatar src={user.avatar_url} initials={initials} size={72} />
              <div className="min-w-0">
                <p className="text-base font-semibold text-ds-text">{displayName}</p>
                <p className="text-sm text-ds-textMuted">{user.email}</p>
                <span className={`inline-block mt-1.5 text-xs font-semibold px-2 py-0.5 rounded-full ${user.role === 'admin' ? 'bg-primary/10 text-primary' : 'bg-ds-bg text-ds-textMuted border border-ds-border'}`}>
                  {user.role === 'admin' ? 'Admin' : 'User'}
                </span>
              </div>
            </div>
          </div>

          {/* Edit name */}
          <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ds-text">Edit Name</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">First Name <span className="text-ds-danger">*</span></label>
                <input type="text" value={firstName} onChange={e => { setFirstName(e.target.value); setNameError(''); }}
                  className={`w-full border rounded-lg px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary transition-colors ${nameError ? 'border-ds-danger' : 'border-ds-inputBorder focus:border-primary'}`} />
                {nameError && <p className="text-xs text-ds-danger mt-1">{nameError}</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Last Name</label>
                <input type="text" value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full border border-ds-inputBorder rounded-lg px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors" />
              </div>
            </div>
            <button onClick={handleSaveName} disabled={nameSaving}
              className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-btn hover:bg-primary-dark disabled:opacity-50 transition-colors">
              {nameSaving ? 'Saving…' : 'Save Name'}
            </button>
          </div>

          {/* Account details */}
          <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ds-text">Account Info</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-xs text-ds-textMuted">Email</dt><dd className="text-ds-text">{user.email}</dd></div>
              <div><dt className="text-xs text-ds-textMuted">Joined</dt><dd className="text-ds-text">{fmtDate(user.created_at)}</dd></div>
              <div><dt className="text-xs text-ds-textMuted">Last Login</dt><dd className="text-ds-text">{user.last_login_at ? fmt(user.last_login_at) : 'Never'}</dd></div>
              <div><dt className="text-xs text-ds-textMuted">Failed Logins</dt><dd className="text-ds-text">{user.failed_login_attempts ?? 0}</dd></div>
            </dl>
            {isLocked && (
              <div className="flex items-center justify-between bg-ds-dangerLight rounded px-3 py-2">
                <p className="text-xs text-ds-danger">Locked until {fmt(user.locked_until)}</p>
                <button onClick={handleUnlock} disabled={saving}
                  className="text-xs text-ds-danger border border-ds-danger rounded px-2 py-0.5 hover:bg-ds-danger hover:text-white transition-colors disabled:opacity-50">
                  Unlock
                </button>
              </div>
            )}
          </div>

          {/* Quick actions — resend invite / password reset */}
          <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ds-text">Quick Actions</h2>
            <div className="flex flex-wrap gap-2">
              {isPending && (
                <button
                  onClick={() => handleAction('resend_invite', 'Invitation')}
                  disabled={!!actionLoading}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-ds-border rounded-btn bg-ds-bg hover:bg-primary hover:text-white hover:border-primary disabled:opacity-50 transition-colors"
                >
                  {actionLoading === 'resend_invite'
                    ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>}
                  Resend Invitation
                </button>
              )}
              <button
                onClick={() => handleAction('send_password_reset', 'Password reset')}
                disabled={!!actionLoading}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium border border-ds-border rounded-btn bg-ds-bg hover:bg-primary hover:text-white hover:border-primary disabled:opacity-50 transition-colors"
              >
                {actionLoading === 'send_password_reset'
                  ? <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>}
                Send Password Reset
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-4">
            <h2 className="text-sm font-semibold text-ds-text">Permissions</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Role</label>
                <select value={role} onChange={e => setRole(e.target.value)} disabled={isSelf && role === 'admin'}
                  className="w-full border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
                {isSelf && <p className="text-xs text-ds-textMuted mt-1">You cannot change your own role.</p>}
              </div>
              <div>
                <label className="block text-xs font-semibold text-ds-textSecondary uppercase tracking-wide mb-1.5">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} disabled={isSelf}
                  className="w-full border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="deactivated">Deactivated</option>
                </select>
              </div>
            </div>
            <button onClick={handleSavePermissions} disabled={saving || isSelf}
              className="bg-primary text-white px-4 py-2 rounded-btn text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
              {saving ? 'Saving…' : 'Save Permissions'}
            </button>
          </div>

          {/* Auth events log */}
          <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-3">
            <h2 className="text-sm font-semibold text-ds-text">Auth Event Log</h2>
            <AuthEventsLog events={events} invites={invites} loading={eventsLoading} />
          </div>

          {/* Danger zone */}
          {!isSelf && (
            <div className="bg-ds-card border border-ds-danger/30 rounded-lg p-6 space-y-3">
              <h2 className="text-sm font-semibold text-ds-danger">Danger Zone</h2>
              <p className="text-xs text-ds-textMuted">Permanently delete this user and all their data. This action cannot be undone.</p>
              {!confirmDelete
                ? <button onClick={() => setConfirmDelete(true)}
                    className="text-sm text-ds-danger border border-ds-danger/50 rounded px-4 py-2 hover:bg-ds-danger hover:text-white transition-colors">
                    Delete User
                  </button>
                : (
                  <div className="space-y-2">
                    <p className="text-sm font-semibold text-ds-danger">Are you sure? This cannot be undone.</p>
                    <div className="flex gap-2">
                      <button onClick={handleDelete} disabled={deleting}
                        className="bg-ds-danger text-white px-4 py-2 rounded-btn text-sm font-semibold disabled:opacity-50 transition-opacity">
                        {deleting ? 'Deleting…' : 'Yes, Delete'}
                      </button>
                      <button onClick={() => setConfirmDelete(false)}
                        className="px-4 py-2 rounded-btn text-sm text-ds-textMuted hover:text-ds-text border border-ds-border transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'self-tests' && <SelfTestsTab userId={id} userName={displayName} />}
      {activeTab === 'resumes'    && <ResumesTab userId={id} />}
    </div>
  );
}

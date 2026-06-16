'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';

const ROLE_LABELS  = { admin: 'Admin', user: 'User' };
const STATUS_LABELS = { active: 'Active', pending: 'Pending', deactivated: 'Deactivated' };
const STATUS_COLORS = {
  active:      'bg-ds-successLight text-ds-success',
  pending:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  deactivated: 'bg-ds-dangerLight text-ds-danger',
};

function fmtDate(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
}

function fmtDateTime(iso) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function useDebounce(value, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

export default function AdminUsersPage() {
  const [users, setUsers]   = useState([]);
  const [total, setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [role, setRole]     = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage]     = useState(1);
  const [sort, setSort]     = useState('created_at');
  const [dir, setDir]       = useState('desc');
  const [impersonating, setImpersonating] = useState(null);
  const [impersonateError, setImpersonateError] = useState('');
  const limit = 20;

  async function handleLoginAs(userId) {
    setImpersonating(userId);
    setImpersonateError('');
    try {
      const r = await fetch('/api/v1/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Failed to start impersonation');
      // Full page reload so the proxy cookie takes effect everywhere
      window.location.href = '/builder';
    } catch (err) {
      setImpersonateError(err.message);
      setImpersonating(null);
    }
  }

  const debouncedSearch = useDebounce(search);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page, limit, sort, dir });
    if (debouncedSearch) params.set('search', debouncedSearch);
    if (role)   params.set('role', role);
    if (status) params.set('status', status);
    try {
      const res = await fetch(`/api/v1/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, role, status, page, sort, dir]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);
  useEffect(() => { setPage(1); }, [debouncedSearch, role, status]);

  const toggleSort = (col) => {
    if (sort === col) setDir(d => d === 'desc' ? 'asc' : 'desc');
    else { setSort(col); setDir('asc'); }
  };

  const SortIcon = ({ col }) => {
    if (sort !== col) return <span className="text-ds-border ml-1">↕</span>;
    return <span className="text-primary ml-1">{dir === 'asc' ? '↑' : '↓'}</span>;
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="gradient-mesh-1 min-h-screen p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-heading text-gradient-primary">Users</h1>
          <p className="text-sm text-ds-textMuted mt-0.5">{total} total</p>
        </div>
        {impersonateError && (
          <span className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700/40 px-3 py-1.5 rounded-lg">
            {impersonateError}
          </span>
        )}
        <Link href="/admin/invite"
          className="bg-primary text-white px-4 py-2 rounded-btn text-sm font-semibold hover:bg-primary/90 transition-colors">
          Invite Users
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by name or email…"
          className="input-enhanced w-full sm:w-64 min-w-0 border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-bg text-ds-text placeholder-ds-textMuted focus:outline-none focus:ring-2 focus:ring-primary" />
        <select value={role} onChange={e => setRole(e.target.value)}
          className="border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select value={status} onChange={e => setStatus(e.target.value)}
          className="border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {/* Table */}
      <div className="card shadow-xs bg-ds-card border border-ds-border rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ds-table">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide cursor-pointer select-none"
                  onClick={() => toggleSort('first_name')}>
                  Name <SortIcon col="first_name" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide cursor-pointer select-none"
                  onClick={() => toggleSort('email')}>
                  Email <SortIcon col="email" />
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Role</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide">Status</th>
                <th className="hidden sm:table-cell text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide cursor-pointer select-none"
                  onClick={() => toggleSort('created_at')}>
                  Joined <SortIcon col="created_at" />
                </th>
                <th className="hidden md:table-cell text-left px-4 py-3 text-xs font-semibold text-ds-textMuted uppercase tracking-wide cursor-pointer select-none"
                  onClick={() => toggleSort('last_login_at')}>
                  Last Login <SortIcon col="last_login_at" />
                </th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-ds-border">
              {loading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3"><Sk className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Sk className="h-4 w-40" /></td>
                      <td className="px-4 py-3"><Sk className="h-5 w-12 rounded-full" /></td>
                      <td className="px-4 py-3"><Sk className="h-5 w-16 rounded-full" /></td>
                      <td className="hidden sm:table-cell px-4 py-3"><Sk className="h-4 w-20" /></td>
                      <td className="hidden md:table-cell px-4 py-3"><Sk className="h-4 w-28" /></td>
                      <td className="px-4 py-3"><Sk className="h-4 w-8" /></td>
                    </tr>
                  ))
                : users.length === 0
                  ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-sm text-ds-textMuted">
                        No users found.
                      </td>
                    </tr>
                  )
                  : users.map(u => (
                    <tr key={u.id} className="hover:bg-ds-bg/50 transition-colors">
                      <td className="px-4 py-3 font-medium text-ds-text">
                        {[u.first_name, u.last_name].filter(Boolean).join(' ') || '—'}
                      </td>
                      <td className="px-4 py-3 text-ds-textMuted">{u.email}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${u.role === 'admin' ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' : 'text-ds-textMuted'}`}>{ROLE_LABELS[u.role] || u.role}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[u.status] ?? 'bg-ds-bg text-ds-textMuted'}`}>
                          {STATUS_LABELS[u.status] || u.status}
                        </span>
                      </td>
                      <td className="hidden sm:table-cell px-4 py-3 text-ds-textMuted text-xs">
                        {fmtDate(u.created_at)}
                      </td>
                      <td className="hidden md:table-cell px-4 py-3 text-ds-textMuted text-xs">
                        {fmtDateTime(u.last_login_at)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <Link href={`/admin/users/${u.id}`}
                            className="text-xs text-primary hover:underline font-medium">
                            Edit
                          </Link>
                          {u.role !== 'admin' && u.status !== 'deactivated' && (
                            <button
                              onClick={() => handleLoginAs(u.id)}
                              disabled={impersonating === u.id}
                              className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {impersonating === u.id ? 'Loading…' : 'Login as'}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
              }
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-ds-border flex items-center justify-between text-xs text-ds-textMuted">
            <span>Showing {(page - 1) * limit + 1}–{Math.min(page * limit, total)} of {total}</span>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1}
                className="px-2 py-1 rounded border border-ds-border hover:bg-ds-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                ← Prev
              </button>
              <button onClick={() => setPage(p => p + 1)} disabled={page >= totalPages}
                className="px-2 py-1 rounded border border-ds-border hover:bg-ds-bg disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

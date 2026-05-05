'use client';
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Sk } from '@/components/Skeleton';
import { useAuth } from '@/hooks/useAuth';

const STATUS_COLORS = {
  active:      'bg-ds-successLight text-ds-success',
  pending:     'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  deactivated: 'bg-ds-dangerLight text-ds-danger',
};

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();

  const [user, setUser]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError]   = useState('');
  const [success, setSuccess] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [role, setRole]     = useState('user');
  const [status, setStatus] = useState('active');

  useEffect(() => {
    fetch(`/api/v1/admin/users/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.user) {
          setUser(data.user);
          setRole(data.user.role);
          setStatus(data.user.status);
        }
      })
      .catch(() => setError('Failed to load user.'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, status }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Update failed.'); return; }
      setSuccess('User updated successfully.');
      setUser(u => ({ ...u, role, status }));
    } catch {
      setError('Update failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnlock = async () => {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locked_until: null, failed_login_attempts: 0 }),
      });
      if (!res.ok) { setError('Unlock failed.'); return; }
      setSuccess('Account unlocked.');
      setUser(u => ({ ...u, locked_until: null, failed_login_attempts: 0 }));
    } catch {
      setError('Unlock failed.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) { const d = await res.json(); setError(d.error || 'Delete failed.'); setDeleting(false); return; }
      router.push('/admin/users');
    } catch {
      setError('Delete failed.');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 max-w-2xl">
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
        <p className="text-ds-textMuted">User not found.</p>
        <Link href="/admin/users" className="text-primary hover:underline text-sm mt-2 block">← Back to users</Link>
      </div>
    );
  }

  const displayName = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email;
  const isLocked = user.locked_until && new Date(user.locked_until) > new Date();
  const isSelf = currentUser?.id === id;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3">
        <Link href="/admin/users" className="text-ds-textMuted hover:text-ds-text text-sm">← Users</Link>
        <span className="text-ds-border">/</span>
        <h1 className="text-xl font-bold text-ds-text font-heading">{displayName}</h1>
        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[user.status] || 'bg-ds-bg text-ds-textMuted'}`}>
          {user.status}
        </span>
      </div>

      {error   && <p className="text-sm text-ds-danger bg-ds-dangerLight rounded px-3 py-2">{error}</p>}
      {success && <p className="text-sm text-ds-success bg-ds-successLight rounded px-3 py-2">{success}</p>}

      {/* Info */}
      <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-3">
        <h2 className="text-sm font-semibold text-ds-text">Account Info</h2>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div><dt className="text-xs text-ds-textMuted">Email</dt><dd className="text-ds-text">{user.email}</dd></div>
          <div><dt className="text-xs text-ds-textMuted">Joined</dt><dd className="text-ds-text">{user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}</dd></div>
          <div><dt className="text-xs text-ds-textMuted">Last Login</dt><dd className="text-ds-text">{user.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Never'}</dd></div>
          <div><dt className="text-xs text-ds-textMuted">Failed Logins</dt><dd className="text-ds-text">{user.failed_login_attempts ?? 0}</dd></div>
        </dl>
        {isLocked && (
          <div className="flex items-center justify-between bg-ds-dangerLight rounded px-3 py-2">
            <p className="text-xs text-ds-danger">Account locked until {new Date(user.locked_until).toLocaleTimeString()}</p>
            <button onClick={handleUnlock} disabled={saving}
              className="text-xs text-ds-danger border border-ds-danger rounded px-2 py-0.5 hover:bg-ds-danger hover:text-white transition-colors disabled:opacity-50">
              Unlock
            </button>
          </div>
        )}
      </div>

      {/* Edit */}
      <div className="bg-ds-card border border-ds-border rounded-lg p-6 space-y-4">
        <h2 className="text-sm font-semibold text-ds-text">Edit Permissions</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} disabled={isSelf && role === 'admin'}
              className="w-full border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
            {isSelf && <p className="text-xs text-ds-textMuted mt-1">You cannot change your own role.</p>}
          </div>
          <div>
            <label className="block text-xs font-semibold text-ds-textMuted uppercase tracking-wide mb-1.5">Status</label>
            <select value={status} onChange={e => setStatus(e.target.value)} disabled={isSelf}
              className="w-full border border-ds-inputBorder rounded px-3 py-2 text-sm bg-ds-bg text-ds-text focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50">
              <option value="active">Active</option>
              <option value="pending">Pending</option>
              <option value="deactivated">Deactivated</option>
            </select>
          </div>
        </div>
        <button onClick={handleSave} disabled={saving || isSelf}
          className="bg-primary text-white px-4 py-2 rounded-btn text-sm font-semibold hover:bg-primary/90 disabled:opacity-50 transition-colors">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
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
  );
}

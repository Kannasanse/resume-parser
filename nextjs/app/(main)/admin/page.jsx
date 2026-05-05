'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

function StatCard({ label, value, href, loading }) {
  const inner = (
    <div className="bg-ds-card border border-ds-border rounded-lg p-5 space-y-1 hover:border-ds-borderStrong transition-colors">
      <p className="text-xs font-semibold text-ds-textMuted uppercase tracking-wide">{label}</p>
      {loading
        ? <div className="h-8 w-16 bg-ds-border/60 rounded-md animate-pulse" />
        : <p className="text-3xl font-bold text-ds-text">{value ?? '—'}</p>}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/v1/admin/users?limit=1').then(r => r.json()),
      fetch('/api/v1/admin/invite?limit=1').then(r => r.json()),
    ]).then(([usersData, inviteData]) => {
      const total = usersData.total ?? 0;
      const pending = inviteData.invites?.filter(i => !i.used_at && new Date(i.expires_at) > new Date()).length ?? 0;
      setStats({ total, pending });
    }).catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-ds-text font-heading">Dashboard</h1>
        <p className="text-sm text-ds-textMuted mt-1">Platform overview and management</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.total} href="/admin/users" loading={loading} />
        <StatCard label="Pending Invites" value={stats?.pending} href="/admin/invite" loading={loading} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ds-textMuted uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

          <Link href="/admin/users"
            className="bg-ds-card border border-ds-border rounded-lg p-4 hover:border-ds-borderStrong transition-colors group">
            <p className="text-sm font-semibold text-ds-text group-hover:text-primary transition-colors">Manage Users</p>
            <p className="text-xs text-ds-textMuted mt-0.5">View, edit, deactivate, and delete users.</p>
          </Link>

          <div className="bg-ds-card border border-ds-border rounded-lg p-4 space-y-3">
            <div>
              <p className="text-sm font-semibold text-ds-text">Invite Users</p>
              <p className="text-xs text-ds-textMuted mt-0.5">Send email invitations to new team members.</p>
            </div>
            <div className="flex gap-2">
              <Link href="/admin/invite"
                className="text-xs font-medium text-white bg-primary px-3 py-1.5 rounded hover:bg-primary/90 transition-colors">
                Invite
              </Link>
              <Link href="/admin/import"
                className="text-xs font-medium text-primary border border-primary/40 px-3 py-1.5 rounded hover:bg-primary/5 transition-colors">
                Bulk Import CSV
              </Link>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

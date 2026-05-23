'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

const STAT_ICONS = {
  'Total Users': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  'Pending Invites': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8l7.89 5.26a2 2 0 0 0 2.22 0L21 8M5 19h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z"/>
    </svg>
  ),
  'Tests': (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
};

function StatCard({ label, value, href, loading }) {
  const inner = (
    <div className="card card-interactive p-5">
      <div className="stat-icon">{STAT_ICONS[label]}</div>
      <p className="text-xs font-semibold text-[var(--c-text-2)] uppercase tracking-wide mb-1">{label}</p>
      {loading
        ? <div className="h-8 w-16 ds-skel rounded-md" />
        : <p className="text-3xl font-bold text-[var(--c-text)]">{value ?? '—'}</p>}
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
      fetch('/api/v1/admin/tests?limit=1').then(r => r.json()),
    ]).then(([usersData, inviteData, testsData]) => {
      const total = usersData.total ?? 0;
      const pending = inviteData.invites?.filter(i => !i.used_at && new Date(i.expires_at) > new Date()).length ?? 0;
      const tests = testsData.total ?? 0;
      setStats({ total, pending, tests });
    }).catch(() => setStats({}))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="gradient-mesh-1 min-h-screen p-8 space-y-8">
      <div>
        <h1 className="text-[28px] font-extrabold tracking-tight font-heading text-gradient-primary">Dashboard</h1>
        <p className="text-sm text-ds-textMuted mt-1">Platform overview and management</p>
      </div>

      <div className="stagger-children grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Users" value={stats?.total} href="/admin/users" loading={loading} />
        <StatCard label="Pending Invites" value={stats?.pending} href="/admin/invite" loading={loading} />
        <StatCard label="Tests" value={stats?.tests} href="/admin/tests" loading={loading} />
      </div>

      <div>
        <h2 className="text-sm font-semibold text-ds-textMuted uppercase tracking-wide mb-3">Quick Actions</h2>
        <div className="stagger-children grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">

          <Link href="/admin/users"
            className="card card-interactive p-4 group">
            <p className="text-sm font-bold text-ds-text group-hover:text-primary transition-colors">Manage Users</p>
            <p className="text-xs text-ds-textMuted mt-0.5">View, edit, deactivate, and delete users.</p>
          </Link>

          <div className="card p-4 space-y-3">
            <div>
              <p className="text-sm font-bold text-ds-text">Invite Users</p>
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

          <Link href="/admin/tests"
            className="card card-interactive p-4 group">
            <p className="text-sm font-bold text-ds-text group-hover:text-primary transition-colors">Manage Tests</p>
            <p className="text-xs text-ds-textMuted mt-0.5">Create and manage assessments for candidates.</p>
          </Link>

          <Link href="/admin/templates"
            className="card card-interactive p-4 group">
            <p className="text-sm font-bold text-ds-text group-hover:text-primary transition-colors">Template Settings</p>
            <p className="text-xs text-ds-textMuted mt-0.5">Mark resume builder templates as Featured.</p>
          </Link>

        </div>
      </div>
    </div>
  );
}

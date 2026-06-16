'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export default function AccessDeniedPage() {
  const { isAdmin } = useAuth();
  const dashboardHref = isAdmin ? '/resumes' : '/builder';
  const dashboardLabel = isAdmin ? 'Go to Resumes' : 'Go to Builder';

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Proflect" height={40} width={118} style={{ height: '40px', width: '118px', minHeight: '40px', minWidth: '118px', maxHeight: '40px', objectFit: 'contain', display: 'block', flexShrink: 0, margin: '0 auto' }} />
        </div>

        <div className="bg-ds-card rounded-2xl border border-ds-border shadow-lg p-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-ds-dangerLight flex items-center justify-center mx-auto">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ds-danger">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>

          <div className="space-y-1">
            <h1 className="font-heading text-2xl font-bold text-ds-text">Access Denied</h1>
            <p className="text-sm text-ds-textSecondary">
              You don't have permission to view this page.
            </p>
          </div>

          <div className="space-y-3 pt-1">
            <Link href={dashboardHref}
              className="block w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary-dark transition-colors text-center">
              {dashboardLabel}
            </Link>
            <Link href="/login" className="block text-xs text-ds-textMuted hover:text-ds-text">
              ← Sign in with a different account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

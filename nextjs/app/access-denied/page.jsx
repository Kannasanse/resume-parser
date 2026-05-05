'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/hooks/useAuth';

export default function AccessDeniedPage() {
  const { isAdmin } = useAuth();
  const dashboardHref = isAdmin ? '/resumes' : '/builder';

  return (
    <div className="min-h-screen bg-ds-bg flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="flex justify-center mb-2">
          <Image src="/logo.png" alt="Resume Builder" width={120} height={66} className="object-contain" />
        </div>

        <div className="w-16 h-16 rounded-full bg-ds-dangerLight flex items-center justify-center mx-auto">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-ds-danger">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>

        <div>
          <h1 className="font-heading text-2xl font-bold text-ds-text">Access Denied</h1>
          <p className="text-sm text-ds-textMuted mt-2">
            You don't have permission to view this page.
            <br />
            Please contact an administrator if you believe this is a mistake.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Link href={dashboardHref}
            className="w-full bg-primary text-white py-2.5 rounded-btn text-sm font-semibold hover:bg-primary/90 transition-colors text-center">
            Go to Dashboard
          </Link>
          <Link href="/login"
            className="block text-xs text-ds-textMuted hover:text-ds-text">
            ← Sign in with a different account
          </Link>
        </div>
      </div>
    </div>
  );
}

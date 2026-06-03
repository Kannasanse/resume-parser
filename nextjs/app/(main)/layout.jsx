'use client';
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Sidebar from '@/components/nav/Sidebar';
import TopBar from '@/components/nav/TopBar';
import ImpersonationBanner from '@/components/impersonation/ImpersonationBanner';
import { useAuth } from '@/hooks/useAuth';

const WARN_AT   = 25 * 60 * 1000;
const LOGOUT_AT = 30 * 60 * 1000;

export default function MainLayout({ children }) {
  const { signOut, user, loading } = useAuth();
  const pathname = usePathname();
  const [showWarning, setShowWarning] = useState(false);

  // Unauthenticated users on /utilities get a sidebar-free layout
  const isPublicUtilities = !loading && !user && pathname?.startsWith('/utilities');
  const idleTimer = useRef(null);
  const warnTimer = useRef(null);

  const resetTimers = () => {
    clearTimeout(idleTimer.current);
    clearTimeout(warnTimer.current);
    setShowWarning(false);
    warnTimer.current = setTimeout(() => setShowWarning(true), WARN_AT);
    idleTimer.current = setTimeout(() => signOut(), LOGOUT_AT);
  };

  useEffect(() => {
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    resetTimers();
    events.forEach(e => window.addEventListener(e, resetTimers, { passive: true }));
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimers));
      clearTimeout(idleTimer.current);
      clearTimeout(warnTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Public utilities layout (no sidebar, no auth required) ──────────────────
  if (isPublicUtilities) {
    return (
      <div className="min-h-screen bg-[#F4F8FC] dark:bg-[#0A1628]">
        {/* Slim top bar */}
        <div className="flex items-center justify-between px-5 py-3 bg-white dark:bg-[#111F35] border-b border-[#D1DCE8] dark:border-white/10">
          <Link href="/home" className="font-bold text-[#185FA5] text-sm tracking-tight">
            Proflect
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login"
              className="text-xs font-medium text-[#6B7280] dark:text-[#8BA3C1] hover:text-[#185FA5] transition-colors">
              Sign in
            </Link>
            <Link href="/signup"
              className="px-3 py-1.5 text-xs font-semibold bg-[#185FA5] hover:bg-[#0C447C] text-white rounded-lg transition-colors">
              Get started free
            </Link>
          </div>
        </div>
        <main>{children}</main>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-[#F4F8FC] dark:bg-[#0A1628]">
      {/* Left sidebar */}
      <Sidebar />

      {/* Right: topbar + page content */}
      <div className="flex-1 flex flex-col min-w-0">
        <ImpersonationBanner />
        <TopBar />
        <main id="layout-main" className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Idle warning overlay */}
      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-[#2C2C2A] dark:text-[#E8EFF7]">Session expiring soon</h2>
                <p className="text-xs text-[#6B7280] dark:text-[#8BA3C1]">You'll be signed out in 5 minutes due to inactivity.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={resetTimers}
                className="flex-1 bg-[#185FA5] text-white py-2 rounded-xl text-sm font-semibold hover:bg-[#1454a0] transition-colors"
              >
                Stay signed in
              </button>
              <button
                onClick={() => signOut()}
                className="flex-1 border border-[#D1DCE8] dark:border-white/10 text-[#6B7280] dark:text-[#8BA3C1] py-2 rounded-xl text-sm hover:text-[#2C2C2A] dark:hover:text-[#E8EFF7] transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

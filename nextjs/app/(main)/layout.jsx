'use client';
import { useEffect, useRef, useState } from 'react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/hooks/useAuth';

const WARN_AT  = 25 * 60 * 1000; // 25 min idle → show warning
const LOGOUT_AT = 30 * 60 * 1000; // 30 min idle → sign out

export default function MainLayout({ children }) {
  const { signOut } = useAuth();
  const [showWarning, setShowWarning] = useState(false);
  const idleTimer  = useRef(null);
  const warnTimer  = useRef(null);

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

  return (
    <div className="min-h-screen bg-ds-bg">
      <Navbar />
      <main className="max-w-6xl mx-auto px-4 py-4 sm:py-8">
        {children}
      </main>

      {showWarning && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4">
          <div className="bg-ds-card border border-ds-border rounded-lg p-6 max-w-sm w-full space-y-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center flex-shrink-0">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-600">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-ds-text">Session expiring soon</h2>
                <p className="text-xs text-ds-textMuted">You'll be signed out in 5 minutes due to inactivity.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={resetTimers}
                className="flex-1 bg-primary text-white py-2 rounded-btn text-sm font-semibold hover:bg-primary/90 transition-colors">
                Stay signed in
              </button>
              <button onClick={() => signOut()}
                className="flex-1 border border-ds-border text-ds-textMuted py-2 rounded-btn text-sm hover:text-ds-text transition-colors">
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

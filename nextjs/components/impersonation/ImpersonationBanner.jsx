'use client';
import { useState, useEffect } from 'react';

export default function ImpersonationBanner() {
  const [proxy, setProxy] = useState(null);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    fetch('/api/v1/admin/impersonate')
      .then(r => r.json())
      .then(d => { if (d.active) setProxy(d.user); })
      .catch(() => {});
  }, []);

  if (!proxy) return null;

  async function handleExit() {
    setExiting(true);
    try {
      await fetch('/api/v1/admin/impersonate', { method: 'DELETE' });
      // Full reload so useAuth re-fetches the real admin profile
      window.location.href = '/admin/users';
    } catch {
      setExiting(false);
    }
  }

  return (
    <div className="relative z-[200] w-full flex-shrink-0 bg-amber-500 dark:bg-amber-600 text-white flex items-center justify-between gap-4 px-4 py-2 shadow-md">
      <div className="flex items-center gap-2 min-w-0">
        <svg
          width="15" height="15" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
          className="flex-shrink-0"
        >
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span className="text-sm font-medium truncate">
          Viewing as&nbsp;<strong>{proxy.name || proxy.email}</strong>
          {proxy.name && (
            <span className="font-normal opacity-80 ml-1 hidden sm:inline">({proxy.email})</span>
          )}
        </span>
      </div>

      <button
        onClick={handleExit}
        disabled={exiting}
        className="flex-shrink-0 flex items-center gap-1.5 bg-white/20 hover:bg-white/30 active:bg-white/40 transition-colors px-3 py-1 rounded-lg text-xs font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
      >
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round"
        >
          <path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/>
        </svg>
        {exiting ? 'Exiting…' : 'Back to Admin'}
      </button>
    </div>
  );
}

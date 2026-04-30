'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/>
      <path d="M14 3v6h6"/>
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2"/>
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <path d="M3 12h18"/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [dark, toggleTheme] = useTheme();
  const { user, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const initials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : 'AU';

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const navLink = (to, label, icon) => {
    const active = pathname === to || pathname.startsWith(to + '/');
    return (
      <Link
        href={to}
        title={label}
        className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
          active
            ? 'bg-ds-bg text-ds-text'
            : 'text-ds-textMuted hover:text-ds-text hover:bg-ds-bg'
        }`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-ds-card border-b border-ds-border">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        {/* Left: logo + nav */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center flex-shrink-0">
            <Image src="/logo.png" alt="resume.parse" width={80} height={44} className="object-contain" priority />
          </Link>

          <div className="flex items-center gap-0.5">
            {navLink('/resumes', 'Profiles', <FileIcon />)}
            {navLink('/jobs', 'Job Profiles', <BriefcaseIcon />)}
          </div>
        </div>

        {/* Right: search hint + theme + user */}
        <div className="flex items-center gap-2">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="w-8 h-8 flex items-center justify-center rounded text-ds-textMuted
              hover:text-ds-text hover:bg-ds-bg transition-colors"
          >
            {dark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* User avatar + dropdown */}
          {user && (
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(v => !v)}
                className="w-7 h-7 rounded-full bg-ds-bg border border-ds-border flex items-center
                  justify-center text-xs font-semibold text-ds-textSecondary font-body
                  hover:border-ds-borderStrong transition-colors"
              >
                {initials}
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 bg-ds-card border border-ds-border
                  rounded shadow-lg min-w-[180px] z-50 py-1">
                  <div className="px-3 py-2 text-xs text-ds-textMuted truncate border-b border-ds-border mb-1">
                    {user.email}
                  </div>
                  <button
                    onClick={() => { setUserMenuOpen(false); signOut(); }}
                    className="w-full text-left px-3 py-1.5 text-sm text-ds-text hover:bg-ds-bg
                      transition-colors rounded-sm"
                  >
                    Sign out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

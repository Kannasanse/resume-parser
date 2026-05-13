'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

function FileIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z"/>
      <path d="M14 3v6h6"/>
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="7" width="18" height="13" rx="2"/>
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      <path d="M3 12h18"/>
    </svg>
  );
}

function PenIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="17 8 12 3 7 8"/>
      <line x1="12" y1="3" x2="12" y2="15"/>
    </svg>
  );
}

function SelfTestIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="8" y="2" width="8" height="4" rx="1"/>
      <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/>
      <path d="m9 12 2 2 4-4"/>
    </svg>
  );
}

function TestIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/>
      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  );
}

function LibraryIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  );
}

function AdminIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="4"/>
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
    </svg>
  );
}

function HamburgerIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="6" x2="21" y2="6"/>
      <line x1="3" y1="12" x2="21" y2="12"/>
      <line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [dark, toggleTheme] = useTheme();
  const { user, isAdmin, displayName, initials, avatarUrl, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const isActive = (to, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + '/');

  const navLink = (to, label, icon, exact = false) => {
    const active = isActive(to, exact);
    return (
      <Link
        href={to}
        title={label}
        className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded text-sm font-medium transition-colors ${
          active ? 'bg-primary-light text-primary' : 'text-ds-text hover:text-primary hover:bg-primary-light'
        }`}
      >
        {icon}
        <span className="hidden sm:inline">{label}</span>
      </Link>
    );
  };

  const drawerLink = (to, label, icon, exact = false) => {
    const active = isActive(to, exact);
    return (
      <Link
        href={to}
        className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
          active ? 'bg-primary-light text-primary' : 'text-ds-text hover:text-primary hover:bg-primary-light'
        }`}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <>
      <nav className="bg-ds-card border-b border-ds-border">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 sm:gap-6">
            {/* Hamburger — mobile only */}
            <button
              onClick={() => setDrawerOpen(v => !v)}
              aria-label="Open menu"
              className="sm:hidden w-8 h-8 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors"
            >
              <HamburgerIcon />
            </button>

            <Link href={isAdmin ? '/resumes' : '/builder'} className="flex items-center flex-shrink-0">
              <Image src="/logo.png" alt="Proflect" width={120} height={133} className="object-contain" priority unoptimized />
            </Link>

            {/* Desktop nav links */}
            <div className="hidden sm:flex items-center gap-0.5">
              {isAdmin ? (
                <>
                  {navLink('/resumes', 'Profiles', <FileIcon />)}
                  {navLink('/jobs', 'Job Profiles', <BriefcaseIcon />)}
                  {navLink('/builder', 'Builder', <PenIcon />)}
                  {navLink('/admin/tests', 'Tests', <TestIcon />)}
                  {navLink('/admin/question-library', 'Library', <LibraryIcon />)}
                  {navLink('/admin', 'Dashboard', <AdminIcon />, true)}
                </>
              ) : (
                <>
                  {navLink('/builder', 'Builder', <PenIcon />)}
                  {navLink('/self-test', 'Self-Test', <SelfTestIcon />)}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-8 h-8 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            {user && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setUserMenuOpen(v => !v)}
                  className="w-7 h-7 rounded-full bg-ds-bg border border-ds-border overflow-hidden flex items-center justify-center text-xs font-semibold text-ds-textSecondary font-body hover:border-ds-borderStrong transition-colors"
                >
                  {avatarUrl
                    ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                    : initials}
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1.5 bg-ds-card border border-ds-border rounded shadow-lg min-w-[180px] z-50 py-1">
                    <div className="px-3 py-2 border-b border-ds-border mb-1">
                      <p className="text-xs font-medium text-ds-text truncate">{displayName}</p>
                      <p className="text-xs text-ds-textMuted truncate">{user.email}</p>
                      {isAdmin && (
                        <span className="inline-block mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                          Admin
                        </span>
                      )}
                    </div>
                    <Link
                      href="/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="w-full text-left px-3 py-1.5 text-sm text-ds-text hover:bg-ds-bg transition-colors rounded-sm flex items-center gap-2"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                      </svg>
                      My Profile
                    </Link>
                    <button
                      onClick={() => { setUserMenuOpen(false); signOut(); }}
                      className="w-full text-left px-3 py-1.5 text-sm text-ds-text hover:bg-ds-bg transition-colors rounded-sm flex items-center gap-2"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {drawerOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 sm:hidden"
          onClick={() => setDrawerOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile drawer */}
      <div className={`fixed top-0 left-0 h-full w-[280px] bg-ds-card border-r border-ds-border z-50 flex flex-col transition-transform duration-200 sm:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-ds-border flex-shrink-0">
          <Link href={isAdmin ? '/resumes' : '/builder'} onClick={() => setDrawerOpen(false)}>
            <Image src="/logo.png" alt="Proflect" width={90} height={100} className="object-contain" unoptimized />
          </Link>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            className="w-8 h-8 flex items-center justify-center rounded text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {isAdmin ? (
            <>
              {drawerLink('/resumes', 'Profiles', <FileIcon />)}
              {drawerLink('/jobs', 'Job Profiles', <BriefcaseIcon />)}
              {drawerLink('/builder', 'Builder', <PenIcon />)}
              {drawerLink('/admin/tests', 'Tests', <TestIcon />)}
              {drawerLink('/admin/question-library', 'Library', <LibraryIcon />)}
              {drawerLink('/admin', 'Dashboard', <AdminIcon />, true)}
            </>
          ) : (
            <>
              {drawerLink('/builder', 'Builder', <PenIcon />)}
              {drawerLink('/self-test', 'Self-Test', <SelfTestIcon />)}
            </>
          )}
        </nav>

        {user && (
          <div className="border-t border-ds-border p-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-full bg-ds-bg border border-ds-border overflow-hidden flex items-center justify-center text-xs font-semibold text-ds-textSecondary flex-shrink-0">
                {avatarUrl
                  ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                  : initials}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-ds-text truncate">{displayName}</p>
                <p className="text-xs text-ds-textMuted truncate">{user.email}</p>
              </div>
            </div>
            <Link
              href="/profile"
              onClick={() => setDrawerOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ds-text hover:bg-ds-bg transition-colors rounded mb-1"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              My Profile
            </Link>
            <button
              onClick={() => { setDrawerOpen(false); signOut(); }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ds-text hover:bg-ds-bg transition-colors rounded"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

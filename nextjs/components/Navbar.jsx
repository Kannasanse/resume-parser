'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

function useCreditBalance(enabled) {
  const [balance, setBalance] = useState(null);
  useEffect(() => {
    if (!enabled) return;
    fetch('/api/v1/credits').then(r => r.ok ? r.json() : null).then(d => {
      if (d?.balance != null) setBalance(d.balance);
    }).catch(() => {});
  }, [enabled]);
  return balance;
}

// ── Icons ─────────────────────────────────────────────────────────────────────
const Ic = ({ d, d2, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

function SearchIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>; }
function BellIcon()      { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10 21a2 2 0 0 0 4 0"/></svg>; }
function SunIcon()       { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>; }
function MoonIcon()      { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>; }
function ChevronDownIcon(){ return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>; }
function HamburgerIcon() { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>; }
function CloseIcon()     { return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>; }

// nav link icons
function FileIcon()      { return <Ic d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9Z" d2="M14 3v6h6" />; }
function BriefcaseIcon() { return <Ic d="M3 7a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" d2="M8 7V5a2 2 0 0 1 4 0v2" />; }
function PenIcon()       { return <Ic d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />; }
function TestIcon()      { return <Ic d="M9 11l3 3L22 4" d2="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />; }
function LibraryIcon()   { return <Ic d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" d2="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />; }
function LayoutIcon()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>; }
function ShieldIcon()    { return <Ic d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />; }
function PortfolioIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>; }
function SelfTestIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="m9 12 2 2 4-4"/></svg>; }
function CareerMapIcon()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><circle cx="5" cy="5" r="2"/><circle cx="19" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M7 7l3.5 3.5M14.5 10.5L17 7M14.5 13.5L17 17"/></svg>; }
function MyCoursesIcon() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>; }

// Dropdown menu items
function MenuItem({ href, icon, label, onClick, danger }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
        danger
          ? 'text-[#D93025] hover:bg-[#FEE2E2]'
          : 'text-[#2C2C2A] hover:bg-[#F4F8FC] dark:text-ds-text dark:hover:bg-ds-bg'
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const [dark, toggleTheme] = useTheme();
  const { user, isAdmin, displayName, initials, avatarUrl, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);
  const moreRef = useRef(null);
  const creditBalance = useCreditBalance(!!user);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
      if (moreRef.current && !moreRef.current.contains(e.target)) setMoreOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => { setDrawerOpen(false); setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = drawerOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const active = (to, exact = false) =>
    exact ? pathname === to : pathname === to || pathname.startsWith(to + '/');

  const navLink = (to, label, icon, exact = false) => (
    <Link
      key={to}
      href={to}
      className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
        active(to, exact)
          ? 'bg-[#E6F1FB] text-[#185FA5]'
          : 'text-[#2C2C2A] hover:bg-[#E6F1FB] hover:text-[#185FA5] dark:text-ds-text dark:hover:bg-ds-bg'
      }`}
    >
      {icon}
      <span className="hidden md:inline">{label}</span>
    </Link>
  );

  const drawerLink = (to, label, icon, exact = false) => (
    <Link
      key={to}
      href={to}
      className={`flex items-center gap-3 px-4 py-3 text-sm font-medium transition-colors ${
        active(to, exact)
          ? 'bg-[#E6F1FB] text-[#185FA5]'
          : 'text-[#2C2C2A] hover:bg-[#E6F1FB] hover:text-[#185FA5] dark:text-ds-text'
      }`}
    >
      {icon}{label}
    </Link>
  );

  // Admin "More" dropdown items
  const moreItems = [
    { to: '/admin/users', label: 'Users' },
    { to: '/admin/invite', label: 'Invite Users' },
    { to: '/admin/import', label: 'Bulk Import' },
    { to: '/admin/templates', label: 'Templates' },
    { to: '/admin/homepage', label: 'Homepage CMS' },
    { to: '/admin/credits', label: 'Credits' },
    { to: '/admin/api-docs', label: 'API Docs' },
  ];
  const moreActive = moreItems.some(m => active(m.to));

  return (
    <>
      {/* ── Main navbar ───────────────────────────────────────────────────────── */}
      <nav className={`sticky top-0 z-40 transition-all duration-200 ${scrolled ? 'glass-light shadow-md border-b border-[rgba(209,220,232,0.6)]' : 'bg-ds-card border-b border-ds-border'} dark:glass-dark`}>
        <div className="h-16 flex items-center gap-6 px-6">

          {/* Hamburger (mobile) */}
          <button
            onClick={() => setDrawerOpen(v => !v)}
            aria-label="Open menu"
            className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors"
          >
            <HamburgerIcon />
          </button>

          {/* Logo */}
          <Link href="/home" className="flex items-center flex-shrink-0 no-underline hover:no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Proflect" className="h-10 w-auto object-contain" />
          </Link>

          {/* Desktop nav links */}
          <div className="hidden sm:flex items-center gap-0.5 flex-1">
            {isAdmin ? (
              <>
                {navLink('/resumes', 'Profiles', <FileIcon />)}
                {navLink('/jobs', 'Job Profiles', <BriefcaseIcon />)}
                {navLink('/builder', 'Builder', <PenIcon />)}
                {navLink('/admin/tests', 'Tests', <TestIcon />)}
                {navLink('/admin/question-library', 'Library', <LibraryIcon />)}
                {navLink('/admin', 'Dashboard', <ShieldIcon />, true)}
                {/* More dropdown */}
                <div ref={moreRef} className="relative">
                  <button
                    onClick={() => setMoreOpen(v => !v)}
                    className={`flex items-center gap-1.5 h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                      moreActive ? 'bg-[#E6F1FB] text-[#185FA5]' : 'text-[#2C2C2A] hover:bg-[#E6F1FB] hover:text-[#185FA5] dark:text-ds-text'
                    }`}
                  >
                    More <ChevronDownIcon />
                  </button>
                  {moreOpen && (
                    <div className="absolute top-[calc(100%+4px)] left-0 min-w-[180px] bg-ds-card border border-ds-border rounded-xl shadow-lg py-1.5 z-50">
                      {moreItems.map(m => (
                        <Link
                          key={m.to}
                          href={m.to}
                          onClick={() => setMoreOpen(false)}
                          className={`flex items-center h-9 px-3 text-sm font-medium transition-colors ${
                            active(m.to) ? 'bg-[#E6F1FB] text-[#185FA5]' : 'text-[#2C2C2A] hover:bg-[#F4F8FC] dark:text-ds-text'
                          }`}
                        >
                          {m.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {navLink('/builder', 'Resume Builder', <PenIcon />)}
                {navLink('/portfolios', 'Portfolios', <PortfolioIcon />)}
                {navLink('/self-test', 'Interview Prep', <SelfTestIcon />)}
                {navLink('/career-map', 'Career Map', <CareerMapIcon />)}
                {navLink('/my-courses', 'My Courses', <MyCoursesIcon />)}
              </>
            )}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1.5 ml-auto">
            {/* Search */}
            <button aria-label="Search" className="w-9 h-9 flex items-center justify-center rounded-full text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors">
              <SearchIcon />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="w-9 h-9 flex items-center justify-center rounded-full text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
            </button>

            {/* Credit balance pill */}
            {user && creditBalance != null && (
              <Link
                href="/credits"
                title="Credit balance"
                style={creditBalance < 5
                  ? { background: 'linear-gradient(135deg,#fee2e2,#fecaca)', border: '1px solid #fca5a5', color: '#dc2626' }
                  : { background: 'linear-gradient(135deg,#fef9c3,#fde68a)', border: '1px solid #fbbf24', color: '#92400e' }
                }
                className="flex items-center gap-1 h-7 px-2.5 rounded-full text-xs font-bold hover:opacity-90 transition-opacity"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" strokeWidth="0" fill={creditBalance < 5 ? '#dc2626' : '#d97706'}>
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {creditBalance}
              </Link>
            )}

            {/* Avatar + profile dropdown */}
            {user && (
              <div ref={menuRef} className="relative">
                <button
                  onClick={() => setMenuOpen(v => !v)}
                  className={`flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full transition-colors border ${
                    menuOpen ? 'bg-ds-bg border-ds-border' : 'border-transparent hover:bg-ds-bg hover:border-ds-border'
                  }`}
                >
                  {/* Avatar */}
                  <span className="w-7 h-7 rounded-full bg-[#E6F1FB] border border-ds-border overflow-hidden flex items-center justify-center text-[11px] font-semibold text-[#185FA5] flex-shrink-0">
                    {avatarUrl
                      ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" />
                      : initials}
                  </span>
                  <span className="hidden md:block text-sm font-medium text-ds-text max-w-[120px] truncate">{displayName}</span>
                  <ChevronDownIcon />
                </button>

                {menuOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] min-w-[260px] bg-ds-card border border-ds-border rounded-xl shadow-lg z-50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 bg-ds-bg border-b border-ds-border">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-full bg-[#E6F1FB] border border-ds-border flex items-center justify-center text-xs font-semibold text-[#185FA5] flex-shrink-0">
                          {avatarUrl
                            ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover rounded-full" />
                            : initials}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-ds-text truncate">{displayName}</p>
                          <p className="text-xs text-ds-textMuted truncate">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 mt-2.5">
                        <span className={`inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold uppercase tracking-wide ${
                          isAdmin ? 'bg-[#E6F1FB] text-[#185FA5]' : 'bg-[#F3F4F6] text-[#6B7280]'
                        }`}>
                          {isAdmin ? 'Admin' : 'User'}
                        </span>
                        <span className="inline-flex items-center h-5 px-2 rounded-full text-[10px] font-semibold uppercase tracking-wide bg-[#D1FAE5] text-[#066043]">
                          Active
                        </span>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-1.5">
                      <MenuItem href="/profile" onClick={() => setMenuOpen(false)} label="My Profile"
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>}
                      />
                      <MenuItem href="/credits" onClick={() => setMenuOpen(false)} label="Credits"
                        icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/></svg>}
                      />
                      {isAdmin && (
                        <MenuItem href="/admin/api-docs" onClick={() => setMenuOpen(false)} label="API Docs"
                          icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>}
                        />
                      )}
                    </div>

                    <div className="border-t border-ds-border mx-2" />

                    <div className="p-1.5">
                      <button
                        onClick={() => { setMenuOpen(false); signOut(); }}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[#D93025] hover:bg-[#FEE2E2] transition-colors"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                        </svg>
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ── Mobile drawer ─────────────────────────────────────────────────────── */}
      {drawerOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 sm:hidden" onClick={() => setDrawerOpen(false)} aria-hidden="true" />
      )}
      <div className={`fixed top-0 left-0 h-full w-72 bg-ds-card border-r border-ds-border z-50 flex flex-col transition-transform duration-200 sm:hidden ${drawerOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-ds-border flex-shrink-0">
          <Link href="/home" onClick={() => setDrawerOpen(false)} className="flex items-center no-underline">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Proflect" className="h-10 w-auto object-contain" />
          </Link>
          <button onClick={() => setDrawerOpen(false)} aria-label="Close menu" className="w-8 h-8 flex items-center justify-center rounded-lg text-ds-textMuted hover:bg-ds-bg">
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
              {drawerLink('/admin', 'Dashboard', <ShieldIcon />, true)}
              <div className="px-4 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-widest text-ds-textMuted">More</div>
              {moreItems.map(m => drawerLink(m.to, m.label, null))}
            </>
          ) : (
            <>
              {drawerLink('/builder', 'Resume Builder', <PenIcon />)}
              {drawerLink('/portfolios', 'Portfolios', <PortfolioIcon />)}
              {drawerLink('/self-test', 'Interview Prep', <SelfTestIcon />)}
              {drawerLink('/career-map', 'Career Map', <CareerMapIcon />)}
              {drawerLink('/my-courses', 'My Courses', <MyCoursesIcon />)}
            </>
          )}
        </nav>

        {user && (
          <div className="border-t border-ds-border p-4 flex-shrink-0">
            <div className="flex items-center gap-3 mb-3">
              <span className="w-8 h-8 rounded-full bg-[#E6F1FB] border border-ds-border flex items-center justify-center text-xs font-semibold text-[#185FA5] flex-shrink-0">
                {avatarUrl ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover rounded-full" /> : initials}
              </span>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ds-text truncate">{displayName}</p>
                <p className="text-xs text-ds-textMuted truncate">{user.email}</p>
              </div>
            </div>
            <Link href="/profile" onClick={() => setDrawerOpen(false)} className="flex items-center gap-2 px-3 py-2 text-sm text-ds-text hover:bg-ds-bg rounded-lg transition-colors mb-1">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              My Profile
            </Link>
            <button onClick={() => { setDrawerOpen(false); signOut(); }} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#D93025] hover:bg-[#FEE2E2] rounded-lg transition-colors">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Sign out
            </button>
          </div>
        )}
      </div>
    </>
  );
}

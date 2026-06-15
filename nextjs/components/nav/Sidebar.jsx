'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

// ── Credit balance hook (admin sidebar only) ─────────────────────────────────
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

// ── Inline icons (Lucide-style strokes matching design) ───────────────────────
const Ic = ({ size = 18, sw = 1.75, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    {children}
  </svg>
);
const Icons = {
  shield: <><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5z" /><path d="m9 12 2 2 4-4" /></>,
  fileText: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="8" y1="13" x2="15" y2="13" /><line x1="8" y1="17" x2="13" y2="17" /></>,
  briefcase: <><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" /><path d="M2 13h20" /></>,
  map: <><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" /><line x1="9" y1="3" x2="9" y2="18" /><line x1="15" y1="6" x2="15" y2="21" /></>,
  bookOpen: <><path d="M2 4h7a3 3 0 0 1 3 3v14a2 2 0 0 0-2-2H2z" /><path d="M22 4h-7a3 3 0 0 0-3 3v14a2 2 0 0 1 2-2h8z" /></>,
  target: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none" /></>,
  notebook: <><path d="M4 4h13a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4z" /><line x1="4" y1="9" x2="8" y2="9" /><line x1="4" y1="14" x2="8" y2="14" /><line x1="4" y1="4" x2="8" y2="4" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" /></>,
  receipt: <><path d="M4 2h16v20l-3-2-3 2-2-2-2 2-3-2-3 2z" /><line x1="8" y1="8" x2="16" y2="8" /><line x1="8" y1="12" x2="16" y2="12" /></>,
  help: <><circle cx="12" cy="12" r="10" /><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" /></>,
  megaphone: <><path d="M3 11v2a2 2 0 0 0 2 2h2l5 4V5L7 9H5a2 2 0 0 0-2 2z" /><path d="M17 7a5 5 0 0 1 0 10" /></>,
  moreH: <><circle cx="5" cy="12" r="1.5" /><circle cx="12" cy="12" r="1.5" /><circle cx="19" cy="12" r="1.5" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  chevronDown: <><polyline points="6 9 12 15 18 9" /></>,
  chevronRight: <><polyline points="9 6 15 12 9 18" /></>,
  panelClose: <><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="9" y1="4" x2="9" y2="20" /><polyline points="16 10 13 12 16 14" /></>,
  panelOpen: <><rect x="3" y="4" width="18" height="16" rx="2" /><line x1="9" y1="4" x2="9" y2="20" /><polyline points="13 10 16 12 13 14" /></>,
  logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
  keyboard: <><rect x="2" y="6" width="20" height="12" rx="2" /><line x1="6" y1="10" x2="6.01" y2="10" /><line x1="10" y1="10" x2="10.01" y2="10" /><line x1="14" y1="10" x2="14.01" y2="10" /><line x1="18" y1="10" x2="18.01" y2="10" /><line x1="7" y1="14" x2="17" y2="14" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></>,
  sun: <><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></>,
  moon: <><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></>,
  sparkles: <><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/><path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z"/></>,
  pen: <><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></>,
  mic: <><path d="M12 2a3 3 0 0 1 3 3v7a3 3 0 0 1-6 0V5a3 3 0 0 1 3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="22"/></>,
  checkSq: <><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></>,
  library: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
  users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
  home: <><path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1Z" /><path d="M9 21V12h6v9" /></>,
  findJobs: <><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><circle cx="11" cy="14" r="2.5"/><path d="m21 21-1.5-1.5"/><path d="m14 17 2 2"/></>,
  code: <><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></>,
  wrench: <><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></>,
};

const NavIc = ({ name, size = 18, sw }) => (
  <Ic size={size} sw={sw}>{Icons[name]}</Ic>
);

// ── Nav configuration ─────────────────────────────────────────────────────────
const USER_NAV_GROUPS = [
  {
    id: 'workspace', label: 'WORKSPACE',
    items: [
      { id: 'builder', icon: 'fileText', label: 'Resume Builder', href: '/builder' },
      { id: 'career-map', icon: 'map', label: 'Career Map', href: '/career-map' },
    ],
  },
  {
    id: 'learning', label: 'LEARNING',
    items: [
      { id: 'my-courses', icon: 'bookOpen', label: 'My Courses', href: '/my-courses' },
      { id: 'self-test', icon: 'target', label: 'Interview Prep', href: '/self-test' },
      { id: 'playground', icon: 'code', label: 'Code Playground', href: '/utilities/playground' },
      { id: 'notes', icon: 'notebook', label: 'Notes', href: '/notes' },
    ],
  },
  {
    id: 'opportunities', label: 'OPPORTUNITIES',
    items: [
      { id: 'job-recommendations', icon: 'findJobs', label: 'Find Jobs', href: '/job-recommendations' },
    ],
  },
  {
    id: 'utilities', label: 'UTILITIES',
    items: [
      { id: 'utilities', icon: 'wrench', label: 'Utilities', href: '/utilities' },
    ],
  },
];


const ADMIN_NAV_GROUPS = [
  {
    id: 'manage', label: 'MANAGE',
    items: [
      { id: 'resumes', icon: 'fileText', label: 'Profiles', href: '/resumes' },
      { id: 'jobs', icon: 'briefcase', label: 'Job Profiles', href: '/jobs' },
      { id: 'users', icon: 'users', label: 'Users', href: '/admin/users' },
      { id: 'builder', icon: 'pen', label: 'Builder', href: '/builder' },
    ],
  },
  {
    id: 'tools', label: 'TOOLS',
    items: [
      { id: 'tests', icon: 'checkSq', label: 'Tests', href: '/admin/tests' },
      { id: 'library', icon: 'library', label: 'Library', href: '/admin/question-library' },
      { id: 'skills', icon: 'code', label: 'Skills', href: '/admin/skills' },
      { id: 'templates', icon: 'notebook', label: 'Templates', href: '/admin/templates' },
      { id: 'credits', icon: 'receipt', label: 'Credits', href: '/admin/credits' },
      { id: 'dashboard', icon: 'shield', label: 'Dashboard', href: '/admin' },
    ],
  },
];


// ── User dropdown popover (rendered via portal to escape overflow-hidden) ─────
function UserDropdown({ user, displayName, initials, avatarUrl, onSignOut, onClose, anchorRect }) {
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  useEffect(() => {
    function handler(e) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const row = 'flex items-center gap-2.5 h-9 px-2.5 rounded-lg text-[14px] cursor-pointer transition-colors';

  const style = anchorRect
    ? { position: 'fixed', left: anchorRect.left, bottom: window.innerHeight - anchorRect.top + 6, zIndex: 200, width: 240 }
    : { position: 'fixed', left: 8, bottom: 80, zIndex: 200, width: 240 };

  const dropdown = (
    <div
      ref={ref}
      style={style}
      className="bg-white dark:bg-[#111F35] border border-[#D1DCE8] dark:border-white/10 rounded-2xl shadow-[0_16px_40px_rgba(12,68,124,0.18)] dark:shadow-[0_16px_40px_rgba(0,0,0,0.4)] p-2"
    >
      {/* Profile header */}
      <div className="flex items-center gap-2.5 p-2.5 bg-[#F4F8FC] dark:bg-[#0D1830] rounded-xl mb-1">
        <span className="w-9 h-9 rounded-full bg-gradient-to-br from-[#185FA5] to-[#0C447C] text-white flex items-center justify-center text-[13px] font-bold flex-shrink-0 overflow-hidden">
          {avatarUrl ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" /> : initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] truncate leading-snug">{displayName}</p>
          <p className="text-[11px] text-[#6B7280] dark:text-[#8BA3C1] truncate">{user?.email}</p>
        </div>
      </div>

      <div className="h-px bg-[#D1DCE8] dark:bg-white/10 my-1 mx-1" />

      <Link href="/profile" onClick={onClose} className={`${row} text-[#2C2C2A] dark:text-[#E8EFF7] hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)]`}>
        <NavIc name="settings" size={15} /> Settings
      </Link>
      <Link href="/credits" onClick={onClose} className={`${row} text-[#2C2C2A] dark:text-[#E8EFF7] hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)]`}>
        <NavIc name="receipt" size={15} /> Billing & Credits
      </Link>

      <div className="h-px bg-[#D1DCE8] dark:bg-white/10 my-1 mx-1" />

      <button
        onClick={() => { onClose(); onSignOut(); }}
        className={`${row} w-full text-[#D93025] hover:bg-[rgba(217,48,37,0.06)] dark:hover:bg-[rgba(217,48,37,0.10)]`}
      >
        <NavIc name="logout" size={15} /> Sign out
      </button>
    </div>
  );

  if (typeof document === 'undefined') return null;
  return createPortal(dropdown, document.body);
}

// ── Tooltip (shown on hover in collapsed mode) ────────────────────────────────
function Tooltip({ label }) {
  return (
    <span className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 bg-[#0C447C] text-white text-[12px] font-medium px-2.5 py-1.5 rounded-lg whitespace-nowrap pointer-events-none shadow-[0_4px_12px_rgba(12,68,124,0.2)] z-50
      before:content-[''] before:absolute before:right-full before:top-1/2 before:-translate-y-1/2 before:border-4 before:border-transparent before:border-r-[#0C447C]">
      {label}
    </span>
  );
}

// ── Nav item ──────────────────────────────────────────────────────────────────
function NavItem({ item, isActive, collapsed, showTooltip, onClick }) {
  const [hovered, setHovered] = useState(false);

  const base = `relative flex items-center gap-2.5 font-medium cursor-pointer transition-colors duration-150 select-none no-underline`;
  const expanded = `h-10 px-3 mx-2 rounded-[10px] text-[14px]`;
  const collapsedCls = `h-11 w-11 mx-auto rounded-xl justify-center`;

  const activeStyle = `bg-[#E6F1FB] dark:bg-[rgba(24,95,165,0.18)] text-[#185FA5] dark:text-[#5B9FD4] font-semibold shadow-[inset_3px_0_0_0_#185FA5]`;
  const hoverStyle = `hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)] hover:text-[#185FA5] dark:hover:text-[#5B9FD4]`;
  const defaultStyle = `text-[#2C2C2A] dark:text-[#E8EFF7]`;

  return (
    <Link
      href={item.href}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`${base} ${collapsed ? collapsedCls : expanded} ${isActive ? activeStyle : `${defaultStyle} ${hoverStyle}`}`}
    >
      <span className={isActive ? 'text-[#185FA5] dark:text-[#5B9FD4]' : 'text-[#6B7280] dark:text-[#8BA3C1]'}>
        <NavIc name={item.icon} size={collapsed ? 20 : 18} />
      </span>
      {!collapsed && <span className="flex-1 truncate">{item.label}</span>}
      {collapsed && (hovered || showTooltip) && <Tooltip label={item.label} />}
    </Link>
  );
}

// ── Main sidebar ──────────────────────────────────────────────────────────────
export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, profile, isAdmin, displayName, initials, avatarUrl, signOut } = useAuth();
  const [dark, toggleTheme] = useTheme();
  const creditBalance = useCreditBalance(isAdmin);

  const [collapsed, setCollapsed] = useState(() => {
    try { return localStorage.getItem('nav_collapsed') === 'true'; } catch { return false; }
  });
  const toggle = useCallback(() => {
    setCollapsed(c => {
      const next = !c;
      try { localStorage.setItem('nav_collapsed', String(next)); } catch {}
      return next;
    });
  }, []);

  const navGroups = isAdmin ? ADMIN_NAV_GROUPS : USER_NAV_GROUPS;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [anchorRect, setAnchorRect] = useState(null);
  const userRowRef = useRef(null);
  const handleUserRowClick = useCallback(() => {
    if (userRowRef.current) setAnchorRect(userRowRef.current.getBoundingClientRect());
    setDropdownOpen(d => !d);
  }, []);

  function isActive(href, exact = false) {
    return exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');
  }

  function activeId() {
    for (const g of navGroups) {
      for (const item of g.items) {
        if (isActive(item.href, item.id === 'dashboard')) return item.id;
      }
    }
    return null;
  }
  const currentActive = activeId();

  const divider = <div className={`h-px bg-[#D1DCE8] dark:bg-white/10 ${collapsed ? 'mx-3' : 'mx-4'} my-2`} />;

  return (
    <aside
      style={{
        width: collapsed ? 64 : 240,
        transition: 'width 220ms cubic-bezier(0.16, 1, 0.3, 1)',
      }}
      className="flex-shrink-0 h-full flex flex-col bg-white dark:bg-[#0D1830] border-r border-[#D1DCE8] dark:border-white/10 overflow-hidden relative"
    >
      {/* ── Header: logo ── */}
      <Link
        href="/"
        className={`flex items-center flex-shrink-0 opacity-100 hover:opacity-75 transition-opacity duration-150 ${collapsed ? 'justify-center px-0 py-5' : 'px-4 py-5'}`}
        title="Go to homepage"
      >
        {collapsed ? (
          <img
            src="/logo.png"
            alt="Proflect"
            style={{ height: 32, width: 32, objectFit: 'cover', objectPosition: 'left center', flexShrink: 0 }}
            className="dark:brightness-0 dark:invert"
          />
        ) : (
          <img
            src="/logo.png"
            alt="Proflect"
            style={{ height: 36, width: 118, objectFit: 'contain', flexShrink: 0 }}
            className="dark:brightness-0 dark:invert"
          />
        )}
      </Link>

      {/* ── Scrollable nav area ── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-1">
        {navGroups.map((group, gi) => (
          <div key={group.id}>
            {gi > 0 && divider}
            {!collapsed && (
              <p className="text-[10px] font-[700] tracking-[0.08em] uppercase text-[#9CA3AF] dark:text-[#4A6380] px-5 mb-1 mt-3 select-none">
                {group.label}
              </p>
            )}
            <div className={collapsed ? 'flex flex-col items-center gap-0.5 py-1' : 'flex flex-col gap-0.5'}>
              {group.items.map(item => (
                <NavItem
                  key={item.id}
                  item={item}
                  isActive={currentActive === item.id}
                  collapsed={collapsed}
                />
              ))}
            </div>
          </div>
        ))}

      </div>

      {/* ── Footer ── */}
      <div className="flex-shrink-0 border-t border-[#D1DCE8] dark:border-white/10 p-2 flex flex-col gap-1">

        {/* Admin-only: credits + theme (moved here from TopBar) */}
        {isAdmin && (
          <>
            {/* Credits pill */}
            {creditBalance != null && (
              collapsed ? (
                <button
                  onClick={() => router.push('/admin/credits')}
                  title={`+${creditBalance} credits`}
                  className="h-11 w-11 mx-auto flex items-center justify-center rounded-xl transition-colors hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)]"
                >
                  <NavIc name="sparkles" size={16} sw={2.25} />
                </button>
              ) : (
                <div className="flex items-center justify-between px-3 py-1.5">
                  <span className="text-[12px] font-medium text-[#9CA3AF] dark:text-[#4A6380]">Credits</span>
                  <button
                    onClick={() => router.push('/admin/credits')}
                    title="AI credits remaining"
                    style={creditBalance < 5
                      ? { background:'linear-gradient(135deg,#fee2e2,#fecaca)', border:'1px solid #fca5a5', color:'#dc2626' }
                      : { background:'linear-gradient(135deg,#FEF3C7,#FDE68A)', border:'1px solid rgba(245,158,11,0.25)', color:'#B45309' }
                    }
                    className="flex items-center gap-1 h-6 px-2 rounded-full text-[12px] font-bold hover:shadow-[0_2px_8px_rgba(245,158,11,0.25)] transition-shadow cursor-pointer"
                  >
                    <NavIc name="sparkles" size={11} sw={2.25} />
                    +{creditBalance}
                  </button>
                </div>
              )
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`flex items-center gap-2.5 cursor-pointer transition-colors text-[#9CA3AF] dark:text-[#4A6380] hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)] hover:text-[#185FA5] dark:hover:text-[#5B9FD4] rounded-lg
                ${collapsed ? 'h-11 w-11 mx-auto justify-center' : 'h-8 px-3 w-full'}`}
            >
              <NavIc name={dark ? 'sun' : 'moon'} size={16} />
              {!collapsed && <span className="text-[12px] font-medium">{dark ? 'Light mode' : 'Dark mode'}</span>}
            </button>
          </>
        )}

        {/* Collapse toggle */}
        <button
          onClick={toggle}
          className={`flex items-center gap-2.5 cursor-pointer transition-colors text-[#9CA3AF] dark:text-[#4A6380] hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)] hover:text-[#185FA5] dark:hover:text-[#5B9FD4] rounded-lg
            ${collapsed ? 'h-11 w-11 mx-auto justify-center' : 'h-8 px-3 w-full'}`}
        >
          <NavIc name={collapsed ? 'panelOpen' : 'panelClose'} size={16} />
          {!collapsed && <span className="text-[12px] font-medium">Collapse</span>}
        </button>

        {/* User row → dropdown (portal) */}
        <div>
          <button
            ref={userRowRef}
            onClick={handleUserRowClick}
            className={`flex items-center gap-2.5 cursor-pointer transition-colors rounded-[10px] hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)] w-full
              ${collapsed ? 'h-11 w-11 mx-auto justify-center p-0' : 'px-2 py-2'}`}
          >
            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-[#185FA5] to-[#0C447C] text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0 overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" /> : initials}
            </span>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[13px] font-medium text-[#2C2C2A] dark:text-[#E8EFF7] truncate leading-snug">{displayName}</p>
                  <p className="text-[11px] text-[#6B7280] dark:text-[#8BA3C1] truncate">{profile?.email || user?.email}</p>
                </div>
                <span className={`text-[#6B7280] dark:text-[#8BA3C1] transition-transform duration-150 ${dropdownOpen ? '-rotate-90' : ''}`}>
                  <NavIc name="chevronDown" size={14} />
                </span>
              </>
            )}
          </button>

          {dropdownOpen && user && (
            <UserDropdown
              user={{ ...user, email: profile?.email || user?.email }}
              displayName={displayName}
              initials={initials}
              avatarUrl={avatarUrl}
              onSignOut={signOut}
              onClose={() => setDropdownOpen(false)}
              anchorRect={anchorRect}
            />
          )}
        </div>
      </div>
    </aside>
  );
}

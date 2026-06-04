'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

// ── Icons ─────────────────────────────────────────────────────────────────────
const MenuIcon  = () => (<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>);
const CloseIcon = () => (<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>);

// ── Nav data ──────────────────────────────────────────────────────────────────
const NAV_GROUPS = [
  {
    id: 'workspace', label: 'Workspace',
    items: [
      { label: 'Resume Builder', href: '/features/resume-builder', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l5.414 5.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2z' },
      { label: 'Portfolio',      href: '/features/portfolio',      icon: 'M19 11H5m14 0a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6a2 2 0 0 1 2-2m14 0V9a2 2 0 0 0-2-2M5 11V9a2 2 0 0 1 2-2m0 0V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v2h2m0-4h10M7 7h10' },
      { label: 'Career Map',     href: '/features/career-map',     icon: 'M9 20l-5.447-2.724A1 1 0 0 1 3 16.382V5.618a1 1 0 0 1 1.447-.894L9 7m0 13l6-3m-6-3V7m6 10l4.553 2.276A1 1 0 0 0 21 18.382V7.618a1 1 0 0 0-1.447-.894L15 9m0 11V9m0 0L9 7' },
    ],
  },
  {
    id: 'learning', label: 'Learning',
    items: [
      { label: 'My Courses',     href: '/features/courses',        icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
      { label: 'Notes',          href: '/features/notes',          icon: 'M9 12h6m-6 4h6M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z' },
      { label: 'Interview Prep', href: '/features/interview-prep', icon: 'M22 10v6M2 10l10-5 10 5-10 5zM6 12v5c3 3 9 3 12 0v-5' },
    ],
  },
  {
    id: 'opportunity', label: 'Opportunity',
    items: [
      { label: 'Job Recommendations', href: '/features/jobs',      icon: 'M21 13.255A23.931 23.931 0 0 1 12 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2m4 6h.01M5 20h14a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2z' },
      { label: 'ATS Score',          href: '/features/ats-score',  icon: 'M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10m-6 0a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2m0 0V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v14a2 2 0 0 0-2 2h-2a2 2 0 0 0-2-2z' },
    ],
  },
];

const UTILITIES_SECTIONS = [
  {
    id: 'pdf', label: 'PDF Tools',
    icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z',
    accent: '#185FA5',
    items: [
      { label: 'Merge PDF',    href: '/utilities/pdf/merge' },
      { label: 'Split PDF',    href: '/utilities/pdf/split' },
      { label: 'Compress PDF', href: '/utilities/pdf/compress' },
      { label: 'Rotate Pages', href: '/utilities/pdf/rotate' },
      { label: 'PDF to Word',  href: '/utilities/pdf/to-word' },
      { label: 'Word to PDF',  href: '/utilities/documents/word-to-pdf' },
      { label: 'Sign PDF',     href: '/utilities/security/sign' },
      { label: 'Protect PDF',  href: '/utilities/security/protect' },
    ],
  },
  {
    id: 'image', label: 'Image Tools',
    icon: 'M3 3h18v18H3zM9 9h.01M21 15l-5-5L5 21',
    accent: '#1D9E75',
    items: [
      { label: 'Compress Image', href: '/utilities/images/compress' },
      { label: 'Resize Image',   href: '/utilities/images/resize' },
      { label: 'Convert Format', href: '/utilities/images/convert' },
      { label: 'Crop Image',     href: '/utilities/images/crop' },
    ],
  },
  {
    id: 'recording', label: 'Recording Tools',
    icon: 'M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3zM19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8',
    accent: '#7C3AED',
    items: [
      { label: 'Screen Recorder & Transcript', href: '/utilities/recorder' },
    ],
  },
];

// ── Dropdown panels ───────────────────────────────────────────────────────────
function SimpleDropdownPanel({ group, onClose, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className="absolute z-50"
      style={{ top: 'calc(100% + 8px)', left: '50%', transform: 'translateX(-50%)' }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{
        minWidth: 200,
        background: 'white',
        border: '1px solid #D1DCE8',
        borderRadius: 14,
        boxShadow: '0 16px 40px rgba(12,68,124,0.13), 0 4px 12px rgba(12,68,124,0.07)',
        padding: '6px',
        animation: 'hnbMenuIn 160ms cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <p className="text-[10px] font-[700] uppercase tracking-[0.08em] px-3 pt-2 pb-1.5" style={{ color: '#9CA3AF' }}>
          {group.label}
        </p>
        {group.items.map(item => (
          <Link
            key={item.label}
            href={item.href}
            onClick={onClose}
            className="flex items-center gap-2.5 px-3 py-2 rounded-[10px] text-[13px] font-medium"
            style={{ color: '#2C2C2A' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#F4F8FC'; e.currentTarget.style.color = '#185FA5'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#2C2C2A'; }}
          >
            <span style={{ color: '#9CA3AF', flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
            </span>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

function UtilitiesMenuPanel({ onClose, onMouseEnter, onMouseLeave }) {
  return (
    <div
      className="absolute z-50"
      style={{ top: 'calc(100% + 8px)', right: 0 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{
        width: 520,
        background: 'white',
        border: '1px solid #D1DCE8',
        borderRadius: 16,
        boxShadow: '0 16px 40px rgba(12,68,124,0.13), 0 4px 12px rgba(12,68,124,0.07)',
        padding: '16px',
        animation: 'hnbMenuInRight 160ms cubic-bezier(0.16,1,0.3,1) both',
      }}>
        <div className="grid grid-cols-3 gap-4">
          {UTILITIES_SECTIONS.map(sec => (
            <div key={sec.id}>
              <div className="flex items-center gap-1.5 mb-2.5">
                <div className="w-5 h-5 flex items-center justify-center" style={{ color: sec.accent }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={sec.icon} />
                  </svg>
                </div>
                <p className="text-[10px] font-[700] uppercase tracking-[0.08em]" style={{ color: sec.accent }}>
                  {sec.label}
                </p>
              </div>
              <div className="flex flex-col">
                {sec.items.map(item => (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    className="text-[12.5px] font-medium px-1.5 py-1.5 rounded-[8px] transition-colors leading-tight"
                    style={{ color: '#374151' }}
                    onMouseEnter={e => { e.currentTarget.style.background = '#F4F8FC'; e.currentTarget.style.color = '#185FA5'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#374151'; }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 pt-3 flex items-center" style={{ borderTop: '1px solid #F0F4F8' }}>
          <Link
            href="/utilities"
            onClick={onClose}
            className="text-[12px] font-semibold ml-auto"
            style={{ color: '#185FA5' }}
          >
            View all 35 tools →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// alwaysSolid: use on non-hero pages (utilities, etc.) — navbar is always white
export default function HomeNavbar({ alwaysSolid = false }) {
  const [scrolled, setScrolled] = useState(alwaysSolid);
  const [menuOpen, setMenuOpen] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const closeTimerRef = useRef(null);
  const navRef = useRef(null);

  useEffect(() => {
    if (alwaysSolid) return;
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [alwaysSolid]);

  useEffect(() => {
    function handleClick(e) {
      if (navRef.current && !navRef.current.contains(e.target)) setOpenMenu(null);
    }
    function handleKey(e) { if (e.key === 'Escape') setOpenMenu(null); }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('mousedown', handleClick); document.removeEventListener('keydown', handleKey); };
  }, []);

  function openDropdown(name) { clearTimeout(closeTimerRef.current); setOpenMenu(name); }
  function scheduleClose() { closeTimerRef.current = setTimeout(() => setOpenMenu(null), 200); }
  function cancelClose() { clearTimeout(closeTimerRef.current); }

  const linkColor = scrolled ? '#2C2C2A' : 'rgba(255,255,255,0.85)';
  const hoverBg   = scrolled ? 'rgba(24,95,165,0.06)' : 'rgba(255,255,255,0.10)';

  return (
    <>
      <nav
        ref={navRef}
        className="fixed top-0 left-0 right-0 z-50"
        style={{
          background: scrolled ? 'rgba(255,255,255,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? '1px solid rgba(209,220,232,0.60)' : '1px solid transparent',
          boxShadow: scrolled ? '0 2px 16px rgba(12,68,124,0.08)' : 'none',
          transition: 'all 300ms cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center flex-shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={scrolled ? '/logo.png' : '/logo-white.png'}
              alt="Proflect"
              height={40} width={118}
              style={{ height: '40px', width: '118px', minHeight: '40px', minWidth: '118px', maxHeight: '40px', objectFit: 'contain', display: 'block', flexShrink: 0 }}
            />
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-0.5">
            {NAV_GROUPS.map(group => (
              <div key={group.id} className="relative" onMouseEnter={() => openDropdown(group.id)} onMouseLeave={scheduleClose}>
                <button
                  onClick={() => openMenu === group.id ? setOpenMenu(null) : openDropdown(group.id)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium"
                  style={{ color: linkColor, transition: 'background 150ms' }}
                  onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  {group.label}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transition: 'transform 200ms', transform: openMenu === group.id ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {openMenu === group.id && (
                  <SimpleDropdownPanel
                    group={group}
                    onClose={() => setOpenMenu(null)}
                    onMouseEnter={cancelClose}
                    onMouseLeave={scheduleClose}
                  />
                )}
              </div>
            ))}

            {/* Utilities mega dropdown */}
            <div className="relative" onMouseEnter={() => openDropdown('utilities')} onMouseLeave={scheduleClose}>
              <button
                onClick={() => openMenu === 'utilities' ? setOpenMenu(null) : openDropdown('utilities')}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium"
                style={{ color: linkColor, transition: 'background 150ms' }}
                onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                Utilities
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transition: 'transform 200ms', transform: openMenu === 'utilities' ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>
              {openMenu === 'utilities' && (
                <UtilitiesMenuPanel
                  onClose={() => setOpenMenu(null)}
                  onMouseEnter={cancelClose}
                  onMouseLeave={scheduleClose}
                />
              )}
            </div>
          </div>

          {/* Right buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold rounded-lg border transition-all"
              style={{ color: scrolled ? '#185FA5' : 'rgba(255,255,255,0.85)', borderColor: scrolled ? '#185FA5' : 'rgba(255,255,255,0.35)', background: 'transparent' }}>
              Log in
            </Link>
            <Link href="/signup" className="px-4 py-2 text-sm font-semibold rounded-lg transition-all"
              style={{ background: scrolled ? '#185FA5' : 'white', color: scrolled ? 'white' : '#185FA5', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
              Get started free
            </Link>
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(true)} className="md:hidden p-2" style={{ color: scrolled ? '#2C2C2A' : 'white' }}>
            <MenuIcon />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMenuOpen(false)} />
          <div className="relative w-80 h-full flex flex-col overflow-y-auto" style={{ background: 'rgba(15,26,46,0.98)', backdropFilter: 'blur(20px)' }}>
            <div className="flex items-center justify-between p-5 pb-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo-white.png" alt="Proflect" height={40} width={118} style={{ height: '40px', width: '118px', minHeight: '40px', minWidth: '118px', maxHeight: '40px', objectFit: 'contain', display: 'block', flexShrink: 0 }} />
              <button onClick={() => setMenuOpen(false)} style={{ color: 'rgba(255,255,255,0.6)' }}><CloseIcon /></button>
            </div>

            <div className="flex flex-col flex-1 px-4 pt-2">
              {NAV_GROUPS.map(group => (
                <div key={group.id}>
                  <button
                    onClick={() => setMobileExpanded(mobileExpanded === group.id ? null : group.id)}
                    className="flex items-center justify-between w-full py-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                  >
                    <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>{group.label}</span>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round"
                      style={{ transform: mobileExpanded === group.id ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', flexShrink: 0 }}>
                      <polyline points="6 9 12 15 18 9"/>
                    </svg>
                  </button>
                  {mobileExpanded === group.id && (
                    <div className="py-1.5 flex flex-col gap-0.5">
                      {group.items.map(item => (
                        <Link
                          key={item.label}
                          href={item.href}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-3 px-2 py-2.5 rounded-lg text-[13px] font-medium"
                          style={{ color: 'rgba(255,255,255,0.75)' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = 'white'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.75)'; }}
                        >
                          <span style={{ color: 'rgba(255,255,255,0.40)', flexShrink: 0 }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                              <path d={item.icon} />
                            </svg>
                          </span>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {/* Utilities expandable */}
              <div>
                <button
                  onClick={() => setMobileExpanded(mobileExpanded === 'utilities' ? null : 'utilities')}
                  className="flex items-center justify-between w-full py-3"
                  style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                >
                  <span className="text-[13px] font-semibold" style={{ color: 'rgba(255,255,255,0.75)' }}>Utilities</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.45)" strokeWidth="2.5" strokeLinecap="round"
                    style={{ transform: mobileExpanded === 'utilities' ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 200ms', flexShrink: 0 }}>
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>
                {mobileExpanded === 'utilities' && (
                  <div className="py-2 flex flex-col gap-4">
                    {UTILITIES_SECTIONS.map(sec => (
                      <div key={sec.id}>
                        <p className="text-[10px] font-[700] uppercase tracking-widest px-2 mb-1" style={{ color: 'rgba(255,255,255,0.35)' }}>
                          {sec.label}
                        </p>
                        {sec.items.map(item => (
                          <Link
                            key={item.label}
                            href={item.href}
                            onClick={() => setMenuOpen(false)}
                            className="flex items-center px-4 py-1.5 rounded-lg text-[13px]"
                            style={{ color: 'rgba(255,255,255,0.65)' }}
                            onMouseEnter={e => e.currentTarget.style.color = 'white'}
                            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.65)'}
                          >
                            {item.label}
                          </Link>
                        ))}
                      </div>
                    ))}
                    <Link href="/utilities" onClick={() => setMenuOpen(false)}
                      className="px-4 text-[12px] font-semibold" style={{ color: '#60A5FA' }}>
                      View all 35 tools →
                    </Link>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-col gap-3 p-4 mt-2">
              <Link href="/login" onClick={() => setMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold rounded-lg border"
                style={{ color: 'rgba(255,255,255,0.85)', borderColor: 'rgba(255,255,255,0.25)' }}>
                Log in
              </Link>
              <Link href="/signup" onClick={() => setMenuOpen(false)}
                className="w-full text-center py-2.5 text-sm font-semibold rounded-lg"
                style={{ background: 'white', color: '#185FA5' }}>
                Get started free
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes hnbMenuIn {
          from { opacity: 0; transform: translateX(-50%) translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0) scale(1); }
        }
        @keyframes hnbMenuInRight {
          from { opacity: 0; transform: translateY(-6px) scale(0.98); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </>
  );
}

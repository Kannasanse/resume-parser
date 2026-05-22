'use client';
import { useState, useEffect } from 'react';
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

// ── Inline icons ──────────────────────────────────────────────────────────────
const Ic = ({ size = 18, sw = 1.75, children }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    {children}
  </svg>
);
const SearchIcon   = () => <Ic><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></Ic>;
const SunIcon      = () => <Ic size={16}><circle cx="12" cy="12" r="4"/><line x1="12" y1="2" x2="12" y2="5"/><line x1="12" y1="19" x2="12" y2="22"/><line x1="4.2" y1="4.2" x2="6.3" y2="6.3"/><line x1="17.7" y1="17.7" x2="19.8" y2="19.8"/><line x1="2" y1="12" x2="5" y2="12"/><line x1="19" y1="12" x2="22" y2="12"/><line x1="4.2" y1="19.8" x2="6.3" y2="17.7"/><line x1="17.7" y1="6.3" x2="19.8" y2="4.2"/></Ic>;
const MoonIcon     = () => <Ic size={16}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></Ic>;
const SparklesIcon = () => <Ic size={13} sw={2.25}><path d="m12 3 1.7 5.3L19 10l-5.3 1.7L12 17l-1.7-5.3L5 10l5.3-1.7z"/><path d="M19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7z"/></Ic>;
const ChevronIcon  = () => <Ic size={13} sw={2}><polyline points="9 6 15 12 9 18"/></Ic>;
const MenuIcon     = () => <Ic><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></Ic>;
const CheckIcon    = () => <Ic size={12}><polyline points="20 6 9 17 4 12"/></Ic>;

// ── Page title + context key lookup ──────────────────────────────────────────
const PAGE_META = [
  { match: p => p === '/home',                         title: 'Home',             ctx: 'default' },
  { match: p => p.startsWith('/builder'),              title: 'Resume Builder',   ctx: 'builder' },
  { match: p => p.startsWith('/portfolios'),           title: 'Portfolios',       ctx: 'default' },
  { match: p => p.startsWith('/self-test'),            title: 'Interview Prep',   ctx: 'default' },
  { match: p => p.startsWith('/career-map'),           title: 'Career Map',       ctx: 'career-map' },
  { match: p => p.startsWith('/my-courses'),           title: 'My Courses',       ctx: 'my-courses' },
  { match: p => p.startsWith('/notes'),                title: 'Notes',            ctx: 'notes' },
  { match: p => p === '/profile',                      title: 'My Profile',       ctx: 'default' },
  { match: p => p === '/credits',                      title: 'Credits',          ctx: 'default' },
  { match: p => p === '/settings',                     title: 'Settings',         ctx: 'default' },
  { match: p => p.startsWith('/resumes'),              title: 'Profiles',         ctx: 'default' },
  { match: p => p.startsWith('/jobs'),                 title: 'Job Profiles',     ctx: 'default' },
  { match: p => p === '/admin',                        title: 'Dashboard',        ctx: 'default' },
  { match: p => p.startsWith('/admin/tests'),          title: 'Tests',            ctx: 'default' },
  { match: p => p.startsWith('/admin/question'),       title: 'Question Library', ctx: 'default' },
  { match: p => p.startsWith('/admin'),                title: 'Admin',            ctx: 'default' },
];

function resolvePage(pathname) {
  const hit = PAGE_META.find(m => m.match(pathname));
  return hit ?? { title: 'Proflect', ctx: 'default' };
}

// ── Context-specific center slot ──────────────────────────────────────────────
function ContextCenter({ ctx }) {
  if (ctx === 'builder') return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5 bg-[#F4F8FC] dark:bg-[#0D1830] border border-[#D1DCE8] dark:border-white/10 rounded-lg px-2.5 py-1 text-[13px] font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">
        <Ic size={14}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></Ic>
        Modern Two-Column
      </div>
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1D9E75]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
        Saved
      </div>
    </div>
  );

  if (ctx === 'career-map') return (
    <div className="flex items-center gap-2 text-[13px] font-medium text-[#2C2C2A] dark:text-[#E8EFF7]">
      <span>Step 2 of 4</span>
      <div className="flex items-center gap-1">
        {[0,1,2,3].map(i => (
          <div key={i} className={`w-1.5 h-1.5 rounded-full transition-colors ${
            i < 1 ? 'bg-[#185FA5]' : i === 1 ? 'bg-[#185FA5] ring-[3px] ring-[rgba(24,95,165,0.18)]' : 'bg-[#D1DCE8] dark:bg-white/20'
          }`} />
        ))}
      </div>
      <span className="text-[#6B7280] dark:text-[#8BA3C1]">· Questionnaire</span>
    </div>
  );

  if (ctx === 'my-courses') return (
    <div className="flex items-center gap-0.5 bg-[#F4F8FC] dark:bg-[#0D1830] border border-[#D1DCE8] dark:border-white/10 rounded-[10px] p-[3px]">
      {['All courses', 'In progress', 'Completed', 'Archived'].map((tab, i) => (
        <div key={tab} className={`px-3 py-1 rounded-[7px] text-[12px] font-medium cursor-pointer transition-all ${
          i === 0
            ? 'bg-white dark:bg-[#1A2C45] text-[#185FA5] dark:text-[#5B9FD4] font-semibold shadow-sm'
            : 'text-[#6B7280] dark:text-[#8BA3C1] hover:text-[#2C2C2A] dark:hover:text-[#E8EFF7]'
        }`}>
          {tab}
        </div>
      ))}
    </div>
  );

  if (ctx === 'notes') return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 text-[12px] font-medium text-[#1D9E75]">
        <div className="w-1.5 h-1.5 rounded-full bg-[#1D9E75]" />
        Saved
      </div>
    </div>
  );

  return null;
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────
function Breadcrumb({ parts }) {
  return (
    <div className="flex items-center gap-1 text-[13px] min-w-0">
      {parts.map((part, i) => {
        const isLast = i === parts.length - 1;
        return (
          <span key={i} className="flex items-center gap-1">
            {isLast
              ? <span className="font-semibold text-[#2C2C2A] dark:text-[#E8EFF7] truncate max-w-[200px]">{part}</span>
              : <span className="text-[#9CA3AF] dark:text-[#4A6380] hover:text-[#185FA5] dark:hover:text-[#5B9FD4] cursor-pointer transition-colors whitespace-nowrap">{part}</span>
            }
            {!isLast && <span className="text-[#D1DCE8] dark:text-white/20"><ChevronIcon /></span>}
          </span>
        );
      })}
    </div>
  );
}

// ── Icon button ───────────────────────────────────────────────────────────────
function IconBtn({ children, onClick, title, className = '' }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`w-9 h-9 flex items-center justify-center rounded-lg text-[#6B7280] dark:text-[#8BA3C1] hover:bg-[rgba(24,95,165,0.06)] dark:hover:bg-[rgba(24,95,165,0.12)] hover:text-[#185FA5] dark:hover:text-[#5B9FD4] transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function TopBar({ onMobileMenu }) {
  const pathname = usePathname();
  const [dark, toggleTheme] = useTheme();
  const { user, initials, avatarUrl } = useAuth();
  const creditBalance = useCreditBalance(!!user);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Listen to the main scroll container (the layout's main element)
    const main = document.getElementById('layout-main');
    if (!main) return;
    const handler = () => setScrolled(main.scrollTop > 8);
    main.addEventListener('scroll', handler, { passive: true });
    return () => main.removeEventListener('scroll', handler);
  }, []);

  const { title, ctx } = resolvePage(pathname);

  // Check for nested breadcrumb routes (e.g., /my-courses/[id]/[topic])
  const parts = pathname.split('/').filter(Boolean);
  const isBreadcrumb = parts.length >= 3 && (parts[0] === 'my-courses' || parts[0] === 'career-map');

  return (
    <header className={`h-[52px] flex-shrink-0 flex items-center px-6 gap-4 bg-white dark:bg-[#111F35] border-b border-[#D1DCE8] dark:border-white/10 transition-shadow duration-200 ${scrolled ? 'shadow-[0_2px_8px_rgba(12,68,124,0.06)]' : ''}`}>

      {/* Mobile hamburger */}
      {onMobileMenu && (
        <IconBtn onClick={onMobileMenu} title="Open menu" className="-ml-2 md:hidden">
          <MenuIcon />
        </IconBtn>
      )}

      {/* Left: page title or breadcrumb */}
      <div className="flex items-center gap-2 min-w-0">
        {isBreadcrumb
          ? <Breadcrumb parts={parts.map(p => p.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase()))} />
          : <h1 className="text-[16px] font-[700] tracking-[-0.01em] text-[#2C2C2A] dark:text-[#E8EFF7] whitespace-nowrap">{title}</h1>
        }
      </div>

      {/* Center: context-specific */}
      <div className="flex-1 flex items-center justify-center gap-3 min-w-0">
        <ContextCenter ctx={ctx} />
      </div>

      {/* Right: utilities */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <IconBtn title="Search · ⌘K">
          <SearchIcon />
        </IconBtn>

        <IconBtn onClick={toggleTheme} title={dark ? 'Switch to light mode' : 'Switch to dark mode'}>
          {dark ? <SunIcon /> : <MoonIcon />}
        </IconBtn>

        {/* Credit balance */}
        {user && creditBalance != null && (
          <Link
            href="/credits"
            title="AI credits remaining"
            style={creditBalance < 5
              ? { background: 'linear-gradient(135deg,#fee2e2,#fecaca)', border: '1px solid #fca5a5', color: '#dc2626' }
              : { background: 'linear-gradient(135deg,#FEF3C7,#FDE68A)', border: '1px solid rgba(245,158,11,0.25)', color: '#B45309' }
            }
            className="flex items-center gap-1 h-7 px-2.5 rounded-full text-[13px] font-bold hover:shadow-[0_2px_8px_rgba(245,158,11,0.25)] transition-shadow ml-1"
          >
            <SparklesIcon />
            +{creditBalance}
          </Link>
        )}

        {/* Avatar — opens user dropdown from topbar (alternative anchor) */}
        {user && (
          <div
            title={initials}
            className="ml-2 w-7 h-7 rounded-full bg-gradient-to-br from-[#185FA5] to-[#0C447C] text-white flex items-center justify-center text-[12px] font-bold cursor-pointer hover:ring-2 hover:ring-[#185FA5] transition-shadow overflow-hidden flex-shrink-0"
          >
            {avatarUrl ? <img src={avatarUrl} alt={initials} className="w-full h-full object-cover" /> : initials}
          </div>
        )}
      </div>
    </header>
  );
}

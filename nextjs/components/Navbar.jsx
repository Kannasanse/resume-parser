'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const pathname = usePathname();
  const [dark, toggleTheme] = useTheme();
  const { user, signOut } = useAuth();

  const navLink = (to, label) => (
    <Link
      href={to}
      className={`px-3 py-1.5 rounded-btn text-sm font-medium transition-colors ${
        pathname.startsWith(to)
          ? 'bg-primary text-white'
          : 'text-ds-textMuted hover:text-ds-text hover:bg-ds-bg'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-ds-card border-b border-ds-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          <span className="font-heading font-bold text-ds-text text-base tracking-tight">
            profile<span className="text-primary"> </span>stream
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {navLink('/resumes', 'Profiles')}
          {navLink('/jobs', 'Job Profiles')}

          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="ml-2 w-8 h-8 flex items-center justify-center rounded-btn text-ds-textMuted hover:text-ds-text hover:bg-ds-bg transition-colors"
          >
            {dark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/>
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/>
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>

          {/* User + sign out */}
          {user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-ds-border">
              <span className="text-xs text-ds-textMuted truncate max-w-[140px]" title={user.email}>
                {user.email}
              </span>
              <button
                onClick={signOut}
                className="text-xs px-2.5 py-1.5 rounded-btn border border-ds-border text-ds-textMuted hover:text-ds-danger hover:border-ds-danger transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

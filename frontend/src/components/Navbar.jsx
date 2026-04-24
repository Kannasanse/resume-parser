import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

export default function Navbar() {
  const { pathname } = useLocation();
  const [dark, toggleTheme] = useTheme();

  const link = (to, label) => (
    <Link
      to={to}
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
        <Link to="/" className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-primary inline-block" />
          <span className="font-heading font-bold text-ds-text text-base tracking-tight">
            resume<span className="text-primary">.</span>parse
          </span>
        </Link>

        <div className="flex items-center gap-1">
          {link('/resumes', 'Profiles')}
          {link('/jobs', 'Job Profiles')}

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
        </div>
      </div>
    </nav>
  );
}

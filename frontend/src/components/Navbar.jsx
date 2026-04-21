import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();

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
          {link('/upload', 'Upload')}
        </div>
      </div>
    </nav>
  );
}

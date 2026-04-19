import { Link, useLocation } from 'react-router-dom';

export default function Navbar() {
  const { pathname } = useLocation();
  const link = (to, label) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        pathname.startsWith(to) ? 'bg-indigo-700 text-white' : 'text-indigo-100 hover:bg-indigo-500'
      }`}
    >
      {label}
    </Link>
  );

  return (
    <nav className="bg-indigo-600 shadow">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <span className="text-white font-bold text-lg">Resume Parser</span>
        <div className="flex gap-2">
          {link('/resumes', 'Resumes')}
          {link('/jobs', 'Job Profiles')}
          {link('/upload', 'Upload')}
        </div>
      </div>
    </nav>
  );
}

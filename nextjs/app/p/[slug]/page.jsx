import { notFound } from 'next/navigation';

export const revalidate = 60;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function fetchPortfolio(slug) {
  try {
    const res = await fetch(`${APP_URL}/api/v1/portfolios/public/${slug}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const data = await fetchPortfolio(slug);
  if (!data?.portfolio) return { title: 'Portfolio' };
  const p = data.portfolio;
  return {
    title: p.name,
    description: p.bio || `${p.name}'s portfolio`,
    openGraph: {
      title: p.name,
      description: p.bio || `${p.name}'s portfolio`,
      type: 'website',
    },
  };
}

const SECTION_ICONS = {
  about:          '👤',
  experience:     '💼',
  education:      '🎓',
  skills:         '⚡',
  projects:       '🚀',
  certifications: '🏅',
  testimonials:   '💬',
  services:       '🛠️',
  contact:        '📬',
  custom:         '✏️',
  embed:          '🔗',
};

export default async function PublicPortfolioPage({ params }) {
  const { slug } = await params;
  const data = await fetchPortfolio(slug);

  if (!data?.portfolio) notFound();

  const { portfolio, sections = [] } = data;

  if (portfolio.status !== 'published') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8">
        <div className="bg-white border border-gray-200 rounded-lg p-8 max-w-sm w-full text-center space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <p className="font-semibold text-gray-900 text-lg">{portfolio.name}</p>
          <p className="text-sm text-gray-500">This portfolio is not published yet.</p>
        </div>
        <footer className="mt-8 text-xs text-gray-400">Built with Proflect</footer>
      </div>
    );
  }

  const sortedSections = [...sections].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .filter(s => s.is_visible !== false);

  const sectionAnchors = sortedSections.map(s => ({
    id: `section-${s.id}`,
    label: s.title || s.section_type,
  }));

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Sticky nav */}
      <nav className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-6">
          <span className="font-semibold text-gray-900 shrink-0">{portfolio.name}</span>
          {sectionAnchors.length > 0 && (
            <div className="flex items-center gap-4 overflow-x-auto scrollbar-none">
              {sectionAnchors.map(a => (
                <a
                  key={a.id}
                  href={`#${a.id}`}
                  className="text-sm text-gray-500 hover:text-gray-900 transition-colors whitespace-nowrap capitalize"
                >
                  {a.label}
                </a>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Portfolio header */}
        <div className="text-center space-y-2 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">{portfolio.name}</h1>
          {portfolio.bio && <p className="text-gray-600 max-w-xl mx-auto">{portfolio.bio}</p>}
        </div>

        {/* Sections */}
        {sortedSections.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-10 text-center">
            <p className="text-gray-500">No sections added yet.</p>
          </div>
        ) : (
          sortedSections.map(section => (
            <section key={section.id} id={`section-${section.id}`} className="scroll-mt-20">
              <div className="bg-white border border-gray-200 rounded-lg p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{SECTION_ICONS[section.section_type] || '📄'}</span>
                  <h2 className="text-xl font-semibold text-gray-900 capitalize">
                    {section.title || section.section_type}
                  </h2>
                </div>
                <p className="text-sm text-gray-400 italic">Content rendering coming soon</p>
              </div>
            </section>
          ))
        )}
      </main>

      <footer className="text-center py-10 text-xs text-gray-400">
        Built with <a href="/" className="hover:text-gray-600 transition-colors">Proflect</a>
      </footer>
    </div>
  );
}

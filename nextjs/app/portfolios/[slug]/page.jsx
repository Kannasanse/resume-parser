import { notFound } from 'next/navigation';
import PortfolioViewTracker from '@/components/portfolio/PortfolioViewTracker';
import PublicPortfolioPage from '@/components/portfolio/PublicPortfolioPage';

export const revalidate = 60;

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const CANONICAL_BASE = 'https://proflect-neo.vercel.app';

async function getPortfolioData(slug) {
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
  const data = await getPortfolioData(slug);

  if (!data?.portfolio) {
    return { title: 'Portfolio not found' };
  }

  const { portfolio } = data;
  const canonical = `${CANONICAL_BASE}/portfolios/${slug}`;

  return {
    title: portfolio.meta_title || portfolio.name || 'Portfolio',
    description: portfolio.meta_description || undefined,
    robots: portfolio.is_indexed ? 'index, follow' : 'noindex, nofollow',
    alternates: { canonical },
    openGraph: {
      type: 'profile',
      url: canonical,
      title: portfolio.meta_title || portfolio.name || 'Portfolio',
      description: portfolio.meta_description || undefined,
      images: portfolio.og_image_url ? [{ url: portfolio.og_image_url }] : undefined,
    },
  };
}

export default async function PublicPortfolioRoute({ params }) {
  const { slug } = await params;
  const data = await getPortfolioData(slug);

  if (!data?.portfolio || data.portfolio.published === false) {
    notFound();
  }

  const { portfolio, sections = [], projects = [] } = data;

  return (
    <>
      <PortfolioViewTracker portfolioId={portfolio.id} />
      <PublicPortfolioPage portfolio={portfolio} sections={sections} projects={projects} />
    </>
  );
}

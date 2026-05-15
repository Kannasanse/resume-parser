import { getHomepageSections, getAllHomepageSections } from '@/lib/homepage.js';
import HomepageContent from './HomepageContent.jsx';

export const revalidate = 60;

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const isPreview = params?.preview === 'true';

  const sections = isPreview
    ? await getAllHomepageSections().catch(() => [])
    : await getHomepageSections().catch(() => []);

  return <HomepageContent sections={sections} isPreview={isPreview} />;
}

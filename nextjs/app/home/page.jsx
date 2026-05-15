import { getHomepageSections } from '@/lib/homepage.js';
import HomepageContent from './HomepageContent.jsx';

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  const sections = await getHomepageSections().catch(() => []);
  return <HomepageContent sections={sections} />;
}

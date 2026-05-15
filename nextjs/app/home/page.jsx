import { getHomepageSections, getAllHomepageSections } from '@/lib/homepage.js';
import { getServerUser } from '@/lib/supabase-server.js';
import supabase from '@/lib/supabase.js';
import HomepageContent from './HomepageContent.jsx';

export const revalidate = 60;

export default async function HomePage({ searchParams }) {
  const params = await searchParams;
  const isPreview = params?.preview === 'true';

  const [sections, user] = await Promise.all([
    isPreview
      ? getAllHomepageSections().catch(() => [])
      : getHomepageSections().catch(() => []),
    getServerUser().catch(() => null),
  ]);

  let userRole = null;
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    userRole = profile?.role || 'user';
  }

  return <HomepageContent sections={sections} isPreview={isPreview} userRole={userRole} />;
}

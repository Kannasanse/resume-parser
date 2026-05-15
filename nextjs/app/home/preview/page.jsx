import { redirect } from 'next/navigation';
import { getAllHomepageSections } from '@/lib/homepage.js';
import { getServerUser } from '@/lib/supabase-server.js';
import supabase from '@/lib/supabase.js';
import HomepageContent from '../HomepageContent.jsx';

// Always SSR — never serve a cached preview
export const dynamic = 'force-dynamic';

export default async function PreviewPage() {
  // Verify the viewer is an admin
  const user = await getServerUser();
  if (!user) redirect('/login?redirect=/home/preview');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') redirect('/builder');

  const sections = await getAllHomepageSections().catch(() => []);

  return <HomepageContent sections={sections} isPreview={true} />;
}

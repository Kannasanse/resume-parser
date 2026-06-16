import { getHomepageSections, getAllHomepageSections } from '@/lib/homepage.js';
import { getServerUser } from '@/lib/supabase-server.js';
import supabase from '@/lib/supabase.js';
import HomepageContent from './HomepageContent.jsx';

export const revalidate = 60;

export const metadata = {
  title: 'Proflect — Resume Builder, Career Map & Portfolio Builder',
  description: 'Build ATS-ready resumes, map your career path, create a stunning portfolio, and prep for interviews — all in one AI-powered platform. Free to start.',
  openGraph: {
    title: 'Proflect — Your career, finally working for you.',
    description: 'Resume builder, career map, portfolio builder, interview prep and personalised study plans. Free forever plan.',
    url: 'https://proflect-neo.vercel.app/home',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Proflect — Your career, finally working for you.',
    description: 'Resume builder, career map, portfolio, interview prep — all in one.',
  },
};

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

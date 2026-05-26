import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';
import { buildJobQuery } from '@/lib/jobs/buildJobQuery.js';
import { getJobsWithCache } from '@/lib/jobs/jobsCache.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: profile } = await supabase
      .from('profiles')
      .select('headline, city, country, skills')
      .eq('id', user.id)
      .single();

    if (!profile?.headline || !profile?.city) {
      return NextResponse.json({
        jobs:    [],
        reason:  'incomplete_profile',
        message: 'Add your job title and city to your profile to see job recommendations.',
      });
    }

    const { query, jobTitle, city, country } = buildJobQuery({
      headline: profile.headline,
      city:     profile.city,
      country:  profile.country,
      skills:   profile.skills ?? [],
    });

    const { jobs, fromCache, cachedAt, quotaExhausted } = await getJobsWithCache({
      query,
      jobTitle,
      city,
      country,
    });

    // Remove jobs this user has dismissed
    const { data: dismissed } = await supabase
      .from('user_job_interactions')
      .select('job_id')
      .eq('user_id', user.id)
      .eq('action', 'dismissed');

    const dismissedIds = new Set((dismissed ?? []).map(d => d.job_id));
    const filtered = jobs.filter(j => !dismissedIds.has(j.job_id));

    return NextResponse.json({
      jobs:            filtered,
      total:           filtered.length,
      from_cache:      fromCache,
      cached_at:       cachedAt,
      query_used:      query,
      location:        { city, country },
      quota_exhausted: quotaExhausted ?? false,
    });
  } catch (err) {
    if (err instanceof Response || err instanceof NextResponse) return err;
    console.error('[jobs/recommendations GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

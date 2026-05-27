import { NextResponse } from 'next/server';
import { getJobsWithCache } from '@/lib/jobs/jobsCache.js';
import { buildJobQuery } from '@/lib/jobs/buildJobQuery.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { query, jobTitle, city, country } = buildJobQuery({
      headline: 'Business Analyst',
      city: 'Chennai',
      country: 'India',
    });

    const { jobs, fromCache, cachedAt, quotaExhausted } = await getJobsWithCache({ query, jobTitle, city, country });

    return NextResponse.json({
      jobs_count:       jobs.length,
      from_cache:       fromCache,
      cached_at:        cachedAt,
      quota_exhausted:  quotaExhausted ?? false,
      first_job_title:  jobs[0]?.title ?? null,
    });
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack?.split('\n').slice(0, 6) });
  }
}

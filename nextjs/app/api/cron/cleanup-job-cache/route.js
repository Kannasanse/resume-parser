import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

// Runs weekly (vercel.json cron). Deletes cache entries expired more than 7 days ago.
// Keeps recently-expired entries so the stale-cache fallback in jobsCache.js can use them.
export async function GET() {
  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase
    .from('job_listings_cache')
    .delete()
    .lt('expires_at', cutoff);

  if (error) {
    console.error('[cron/cleanup-job-cache]', error);
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

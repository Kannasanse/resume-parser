import supabase from '@/lib/supabase.js';
import { buildCacheKey } from './buildJobQuery.js';
import { fetchFromJSearch } from './fetchFromJSearch.js';
import { checkQuota, logApiCall } from './quotaMonitor.js';

const CACHE_TTL_HOURS = 12;

export async function getJobsWithCache({ query, jobTitle, city }) {
  const cacheKey = buildCacheKey(jobTitle, city);

  // 1. Try fresh cache
  try {
    const { data: cached, error } = await supabase
      .from('job_listings_cache')
      .select('jobs, cached_at, hit_count')
      .eq('cache_key', cacheKey)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (cached && !error) {
      // Bump counters fire-and-forget
      supabase.from('job_listings_cache').update({
        hit_count:   (cached.hit_count ?? 0) + 1,
        last_hit_at: new Date().toISOString(),
      }).eq('cache_key', cacheKey).then(() => {});

      return { jobs: cached.jobs, fromCache: true, cachedAt: cached.cached_at };
    }
  } catch {}

  // 2. Guard against quota exhaustion before calling the paid API
  const quota = await checkQuota();
  if (quota.exhausted) {
    console.warn('[JSearch] Monthly quota exhausted — returning stale cache');
    const { data: stale } = await supabase
      .from('job_listings_cache')
      .select('jobs, cached_at')
      .eq('cache_key', cacheKey)
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return {
      jobs:           stale?.jobs ?? [],
      fromCache:      true,
      cachedAt:       stale?.cached_at ?? null,
      quotaExhausted: true,
    };
  }

  // 3. Live fetch
  let jobs = [];
  try {
    jobs = await fetchFromJSearch(query, { numPages: 1, datePosted: 'month' });
    await logApiCall(query, jobs.length);
  } catch (err) {
    console.error('[JSearch] API call failed:', err);
    // Fall back to any stale entry rather than returning nothing
    const { data: stale } = await supabase
      .from('job_listings_cache')
      .select('jobs, cached_at')
      .eq('cache_key', cacheKey)
      .order('cached_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (stale) return { jobs: stale.jobs, fromCache: true, cachedAt: stale.cached_at };
    return { jobs: [], fromCache: false, cachedAt: null };
  }

  // 4. Write / refresh cache
  if (jobs.length > 0) {
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CACHE_TTL_HOURS);

    supabase.from('job_listings_cache').upsert({
      cache_key:    cacheKey,
      query_text:   query,
      job_title:    jobTitle,
      city,
      country:      'India',
      jobs,
      result_count: jobs.length,
      hit_count:    0,
      cached_at:    new Date().toISOString(),
      expires_at:   expiresAt.toISOString(),
      last_hit_at:  null,
    }, { onConflict: 'cache_key' }).then(() => {});
  }

  return { jobs, fromCache: false, cachedAt: new Date().toISOString() };
}

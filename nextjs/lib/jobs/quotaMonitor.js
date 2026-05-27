import supabase from '@/lib/supabase.js';

const MONTHLY_LIMIT = 190; // 10-call buffer below the 200/month free tier

export async function checkQuota() {
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const { count } = await supabase
    .from('jsearch_quota_log')
    .select('*', { count: 'exact', head: true })
    .gte('called_at', monthStart);
  const used = count ?? 0;
  return {
    used,
    remaining:  Math.max(0, MONTHLY_LIMIT - used),
    exhausted:  used >= MONTHLY_LIMIT,
  };
}

export async function logApiCall(query, resultCount) {
  await supabase
    .from('jsearch_quota_log')
    .insert({ query, result_count: resultCount });
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { grantCredits } from '@/lib/credits.js';

// GET /api/v1/admin/credits/requests
export async function GET(request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    // credit_requests.user_id -> auth.users (not public.profiles), so PostgREST
    // can't resolve the join inline. Fetch requests first, then hydrate profiles.
    let query = supabase
      .from('credit_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all') query = query.eq('status', status);

    const { data: requests, error } = await query;
    if (error) throw error;
    if (!requests?.length) return NextResponse.json({ requests: [] });

    // Fetch profiles for all unique user_ids in one query
    const userIds = [...new Set(requests.map(r => r.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email')
      .in('id', userIds);

    const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
    const enriched = requests.map(r => ({ ...r, profiles: profileMap[r.user_id] || null }));

    return NextResponse.json({ requests: enriched });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

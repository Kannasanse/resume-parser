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

    const query = supabase
      .from('credit_requests')
      .select('*, profiles:user_id(first_name, last_name, email)')
      .order('created_at', { ascending: false });

    if (status !== 'all') query.eq('status', status);

    const { data } = await query;
    return NextResponse.json({ requests: data || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

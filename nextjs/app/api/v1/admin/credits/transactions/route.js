import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

// GET /api/v1/admin/credits/transactions — all credit transactions with user info
export async function GET(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page   = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit  = 50;
    const from   = (page - 1) * limit;
    const userId = searchParams.get('user_id') || null;

    let query = supabase
      .from('credit_transactions')
      .select('*, profiles:user_id(first_name, last_name, email)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (userId) query = query.eq('user_id', userId);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ transactions: data || [], total: count ?? 0 });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

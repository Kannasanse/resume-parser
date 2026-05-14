import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { grantCredits } from '@/lib/credits.js';

// GET /api/v1/admin/credits — all users with credit info + recent transactions
export async function GET(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = 20;
    const from  = (page - 1) * limit;

    const { data: users, count } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (!users?.length) return NextResponse.json({ users: [], total: 0 });

    const userIds = users.map(u => u.id);

    const { data: credits } = await supabase
      .from('user_credits')
      .select('user_id, balance, updated_at')
      .in('user_id', userIds);

    const creditMap = Object.fromEntries((credits || []).map(c => [c.user_id, c]));

    const result = users.map(u => ({
      ...u,
      balance: creditMap[u.id]?.balance ?? null,
      credits_updated_at: creditMap[u.id]?.updated_at ?? null,
    }));

    return NextResponse.json({ users: result, total: count });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/v1/admin/credits — grant credits to a user
export async function POST(request) {
  try {
    const { user: adminUser, profile: adminProfile } = await requireAdmin(request);
    const { user_id, amount, description } = await request.json();

    if (!user_id || !amount || amount < 1 || amount > 500) {
      return NextResponse.json({ error: 'user_id and amount (1-500) are required.' }, { status: 400 });
    }

    const newBalance = await grantCredits(
      user_id,
      amount,
      'admin_grant',
      description || `Credits granted by admin (${adminProfile.first_name || adminProfile.email})`
    );

    return NextResponse.json({ ok: true, new_balance: newBalance });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

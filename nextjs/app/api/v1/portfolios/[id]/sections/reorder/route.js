import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function POST(req, { params }) {
  const { id } = await params;
  let user;
  try { ({ user } = await requireUser(req)); } catch (e) { return e; }
  const { data: portfolio } = await supabase.from('portfolios').select('id').eq('id', id).eq('user_id', user.id).single();
  if (!portfolio) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const { orders } = await req.json().catch(() => ({}));
  if (!Array.isArray(orders)) return NextResponse.json({ error: 'orders array required' }, { status: 400 });
  for (const { id: secId, sort_order } of orders) {
    await supabase.from('portfolio_sections').update({ sort_order }).eq('id', secId).eq('portfolio_id', id);
  }
  return NextResponse.json({ ok: true });
}

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

async function checkOwner(req, portfolioId) {
  let user;
  try { ({ user } = await requireUser(req)); } catch (e) { return { err: e }; }
  const { data } = await supabase.from('portfolios').select('id').eq('id', portfolioId).eq('user_id', user.id).single();
  if (!data) return { err: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  return { user };
}

export async function PATCH(req, { params }) {
  const { id, sectionId } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  const body = await req.json().catch(() => null);
  const allowed = ['content', 'is_visible', 'sort_order'];
  const updates = { updated_at: new Date().toISOString() };
  for (const k of allowed) { if (body?.[k] !== undefined) updates[k] = body[k]; }
  const { data, error } = await supabase.from('portfolio_sections').update(updates).eq('id', sectionId).eq('portfolio_id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ section: data });
}

export async function DELETE(req, { params }) {
  const { id, sectionId } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  await supabase.from('portfolio_sections').delete().eq('id', sectionId).eq('portfolio_id', id);
  return NextResponse.json({ ok: true });
}

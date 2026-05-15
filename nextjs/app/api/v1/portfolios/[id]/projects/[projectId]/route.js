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

export async function GET(req, { params }) {
  const { id, projectId } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  const { data, error } = await supabase.from('portfolio_projects').select('*').eq('id', projectId).eq('portfolio_id', id).single();
  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ project: data });
}

export async function PATCH(req, { params }) {
  const { id, projectId } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  const body = await req.json().catch(() => null);
  const updates = { ...body, updated_at: new Date().toISOString() };
  delete updates.id; delete updates.portfolio_id; delete updates.created_at;
  const { data, error } = await supabase.from('portfolio_projects').update(updates).eq('id', projectId).eq('portfolio_id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data });
}

export async function DELETE(req, { params }) {
  const { id, projectId } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  await supabase.from('portfolio_projects').delete().eq('id', projectId).eq('portfolio_id', id);
  return NextResponse.json({ ok: true });
}

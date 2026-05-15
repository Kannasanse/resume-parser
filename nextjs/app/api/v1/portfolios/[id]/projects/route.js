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
  const { id } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  const { data, error } = await supabase.from('portfolio_projects').select('*').eq('portfolio_id', id).order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data });
}

export async function POST(req, { params }) {
  const { id } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  const body = await req.json().catch(() => null);
  const { title, ...rest } = body || {};
  if (!title) return NextResponse.json({ error: 'title required' }, { status: 400 });
  const { data: max } = await supabase.from('portfolio_projects').select('sort_order').eq('portfolio_id', id).order('sort_order', { ascending: false }).limit(1).single();
  const sort_order = (max?.sort_order ?? -1) + 1;
  const { data, error } = await supabase.from('portfolio_projects').insert({ portfolio_id: id, title, sort_order, ...rest }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}

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
  const { data, error } = await supabase.from('portfolio_sections').select('*').eq('portfolio_id', id).order('sort_order');
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ sections: data });
}

export async function POST(req, { params }) {
  const { id } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  const body = await req.json().catch(() => null);
  const { section_type, content = {}, is_visible = true } = body || {};
  if (!section_type) return NextResponse.json({ error: 'section_type required' }, { status: 400 });
  const { data: max } = await supabase.from('portfolio_sections').select('sort_order').eq('portfolio_id', id).order('sort_order', { ascending: false }).limit(1).single();
  const sort_order = (max?.sort_order ?? -1) + 1;
  const { data, error } = await supabase.from('portfolio_sections').insert({ portfolio_id: id, section_type, sort_order, is_visible, content }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ section: data }, { status: 201 });
}

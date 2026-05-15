import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

async function checkOwner(req, id) {
  let user;
  try { ({ user } = await requireUser(req)); } catch (e) { return { err: e }; }
  const { data } = await supabase.from('portfolios').select('*').eq('id', id).eq('user_id', user.id).single();
  if (!data) return { err: NextResponse.json({ error: 'Not found' }, { status: 404 }) };
  return { user, portfolio: data };
}

export async function GET(req, { params }) {
  const { id } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  const { data: sections } = await supabase.from('portfolio_sections').select('*').eq('portfolio_id', id).order('sort_order');
  const { data: projects } = await supabase.from('portfolio_projects').select('*').eq('portfolio_id', id).order('sort_order');
  return NextResponse.json({ portfolio: check.portfolio, sections: sections || [], projects: projects || [] });
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  const body = await req.json().catch(() => null);
  const allowed = ['name','slug','status','template_id','customisation','is_linked_to_resume','meta_title','meta_description','og_image_url','is_indexed','resume_id'];
  const updates = {};
  for (const k of allowed) { if (body?.[k] !== undefined) updates[k] = body[k]; }
  if (body?.status === 'published' && check.portfolio.status !== 'published') {
    updates.published_at = new Date().toISOString();
  }
  updates.updated_at = new Date().toISOString();
  const { data, error } = await supabase.from('portfolios').update(updates).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ portfolio: data });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const check = await checkOwner(req, id);
  if (check.err) return check.err;
  await supabase.from('portfolios').delete().eq('id', id);
  return NextResponse.json({ ok: true });
}

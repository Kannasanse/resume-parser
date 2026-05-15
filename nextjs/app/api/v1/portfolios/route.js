import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function GET(req) {
  let user;
  try { ({ user } = await requireUser(req)); } catch (e) { return e; }
  const { data, error } = await supabase
    .from('portfolios')
    .select('*, portfolio_sections(count), portfolio_projects(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ portfolios: data });
}

export async function POST(req) {
  let user;
  try { ({ user } = await requireUser(req)); } catch (e) { return e; }
  const body = await req.json().catch(() => null);
  const { name, slug, template_id = 'minimal', resume_id, is_linked_to_resume = false } = body || {};
  if (!name) return NextResponse.json({ error: 'name required' }, { status: 400 });

  // Check slug uniqueness
  if (slug) {
    const { data: existing } = await supabase.from('portfolios').select('id').eq('slug', slug).single();
    if (existing) return NextResponse.json({ error: 'Slug already taken' }, { status: 409 });
  }

  const { data: portfolio, error } = await supabase.from('portfolios').insert({
    user_id: user.id, name, slug: slug || null, template_id,
    resume_id: resume_id || null, is_linked_to_resume,
    status: 'draft',
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Create default sections
  const defaultSections = is_linked_to_resume
    ? ['about', 'work_experience', 'education', 'skills', 'projects', 'contact_form']
    : ['about', 'projects', 'skills', 'contact_form'];

  const sectionRows = defaultSections.map((type, i) => ({
    portfolio_id: portfolio.id, section_type: type, sort_order: i, is_visible: true, content: {}
  }));
  await supabase.from('portfolio_sections').insert(sectionRows);

  return NextResponse.json({ portfolio }, { status: 201 });
}

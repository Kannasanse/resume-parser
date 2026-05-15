import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

export async function GET(req, { params }) {
  const { slug } = await params;
  const { data: portfolio, error } = await supabase
    .from('portfolios')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single();
  if (error || !portfolio) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const [{ data: sections }, { data: projects }] = await Promise.all([
    supabase.from('portfolio_sections').select('*').eq('portfolio_id', portfolio.id).eq('is_visible', true).order('sort_order'),
    supabase.from('portfolio_projects').select('*').eq('portfolio_id', portfolio.id).neq('visibility', 'private').order('sort_order'),
  ]);
  // Increment view count (fire and forget)
  supabase.from('portfolios').update({ view_count: (portfolio.view_count || 0) + 1 }).eq('id', portfolio.id).then(() => {});
  return NextResponse.json({ portfolio, sections: sections || [], projects: projects || [] });
}

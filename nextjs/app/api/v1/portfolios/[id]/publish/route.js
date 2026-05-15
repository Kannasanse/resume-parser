import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function POST(req, { params }) {
  const { id } = await params;
  let user;
  try { ({ user } = await requireUser(req)); } catch (e) { return e; }
  const { data: portfolio } = await supabase.from('portfolios').select('*').eq('id', id).eq('user_id', user.id).single();
  if (!portfolio) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (!portfolio.slug) return NextResponse.json({ error: 'A URL slug is required before publishing' }, { status: 400 });
  const { data, error } = await supabase.from('portfolios').update({
    status: 'published',
    published_at: portfolio.published_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // ISR revalidation would go here
  return NextResponse.json({ portfolio: data });
}

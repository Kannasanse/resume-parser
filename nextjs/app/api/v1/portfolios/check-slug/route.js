import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const excludeId = searchParams.get('id');
  if (!slug) return NextResponse.json({ available: false, error: 'slug required' });
  if (!/^[a-z0-9-]+$/.test(slug)) return NextResponse.json({ available: false, error: 'Invalid slug format' });
  let query = supabase.from('portfolios').select('id').eq('slug', slug);
  if (excludeId) query = query.neq('id', excludeId);
  const { data } = await query.single();
  return NextResponse.json({ available: !data });
}

import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET /api/v1/skills/trending?limit=12
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.max(1, parseInt(searchParams.get('limit') || '12', 10));

    const { data, error } = await supabase
      .from('skills')
      .select('id, name, slug, category, description, selection_count')
      .eq('is_active', true)
      .eq('is_trending', true)
      .order('selection_count', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return NextResponse.json({ skills: data || [] });
  } catch (err) {
    console.error('[skills/trending GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

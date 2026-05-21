import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET /api/v1/skills/search?q=&limit=20&category=all
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q        = searchParams.get('q')?.trim() || '';
    const limit    = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
    const category = searchParams.get('category') || 'all';

    const SELECT = 'id, name, slug, category, aliases, description, selection_count, is_trending';

    if (!q) {
      // Return popular skills
      let query = supabase
        .from('skills')
        .select(SELECT)
        .eq('is_active', true)
        .order('selection_count', { ascending: false })
        .limit(limit);

      if (category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;

      return NextResponse.json({
        skills: data || [],
        source: 'popular',
        hasExactMatch: false,
        searchTerm: '',
      });
    }

    // Search by name or slug
    let query = supabase
      .from('skills')
      .select(SELECT)
      .eq('is_active', true)
      .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
      .order('selection_count', { ascending: false })
      .limit(limit);

    if (category !== 'all') {
      query = query.eq('category', category);
    }

    const { data, error } = await query;
    if (error) throw error;

    const skills = data || [];
    const hasExactMatch = skills.some(s => s.name.toLowerCase() === q.toLowerCase());

    return NextResponse.json({
      skills,
      source: 'search',
      hasExactMatch,
      searchTerm: q,
    });
  } catch (err) {
    console.error('[skills/search GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

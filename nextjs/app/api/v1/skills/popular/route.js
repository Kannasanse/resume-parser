import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET /api/v1/skills/popular?limit=32&category=all
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit    = Math.max(1, parseInt(searchParams.get('limit') || '32', 10));
    const category = searchParams.get('category') || 'all';

    const SELECT = 'id, name, slug, category, aliases, description, selection_count, is_trending';

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

    const skills = data || [];

    // Group by category
    const byCategory = {};
    for (const skill of skills) {
      const cat = skill.category || 'Other';
      if (!byCategory[cat]) byCategory[cat] = [];
      byCategory[cat].push(skill);
    }

    return NextResponse.json({ skills, byCategory });
  } catch (err) {
    console.error('[skills/popular GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

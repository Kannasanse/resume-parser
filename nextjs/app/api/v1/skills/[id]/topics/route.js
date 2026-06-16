import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

/**
 * GET /api/v1/skills/[id]/topics?q=&limit=8
 * Public endpoint — no auth required.
 * Returns active topics for a skill, sorted by usage_count desc.
 * Used for topic hint autocomplete in the self-test form.
 */
export async function GET(request, { params }) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const q     = searchParams.get('q')?.trim() || '';
    const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '8')), 20);

    let query = supabase
      .from('skill_topics')
      .select('id, name, slug, usage_count')
      .eq('skill_id', id)
      .eq('is_active', true)
      .order('usage_count', { ascending: false })
      .order('name', { ascending: true })
      .limit(limit);

    if (q) query = query.ilike('name', `%${q}%`);

    const { data, error } = await query;
    if (error) throw error;

    return Response.json({ topics: data || [] });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

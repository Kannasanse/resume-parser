import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

const SELECT = 'id, name, slug, category, aliases, description, selection_count, is_trending';

// GET /api/v1/skills/search?q=&limit=20&category=all
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const q        = searchParams.get('q')?.trim() || '';
    const limit    = Math.max(1, parseInt(searchParams.get('limit') || '20', 10));
    const category = searchParams.get('category') || 'all';

    if (!q) {
      let query = supabase
        .from('skills').select(SELECT).eq('is_active', true)
        .order('selection_count', { ascending: false }).limit(limit);
      if (category !== 'all') query = query.eq('category', category);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({
        skills: (data || []).map(s => ({ ...s, matchedAlias: null })),
        source: 'popular', hasExactMatch: false, searchTerm: '',
      });
    }

    const qLower = q.toLowerCase();

    // 1. Name / slug search
    let nameQuery = supabase
      .from('skills').select(SELECT).eq('is_active', true)
      .or(`name.ilike.%${q}%,slug.ilike.%${q}%`)
      .order('selection_count', { ascending: false }).limit(limit);
    if (category !== 'all') nameQuery = nameQuery.eq('category', category);
    const { data: nameData } = await nameQuery;

    // 2. Exact alias array match
    let aliasQuery = supabase
      .from('skills').select(SELECT).eq('is_active', true)
      .contains('aliases', [q]).limit(5);
    if (category !== 'all') aliasQuery = aliasQuery.eq('category', category);
    const { data: aliasData } = await aliasQuery;

    // 3. Fuzzy alias text match
    let fuzzyQuery = supabase
      .from('skills').select(SELECT).eq('is_active', true)
      .filter('aliases::text', 'ilike', `%${q}%`).limit(5);
    if (category !== 'all') fuzzyQuery = fuzzyQuery.eq('category', category);
    const { data: fuzzyData } = await fuzzyQuery;

    // Merge + deduplicate, attach matchedAlias flag
    const nameIds  = new Set((nameData  || []).map(s => s.id));
    const aliasIds = new Set((aliasData || []).map(s => s.id));
    const combined = [
      ...(nameData || []).map(s => ({ ...s, matchedAlias: null })),
      ...(aliasData || []).map(s => ({
        ...s,
        matchedAlias: (s.aliases || []).find(a => a.toLowerCase() === qLower) || null,
      })),
      ...(fuzzyData || [])
        .filter(s => !nameIds.has(s.id) && !aliasIds.has(s.id))
        .map(s => ({
          ...s,
          matchedAlias: (s.aliases || []).find(a => a.toLowerCase().includes(qLower)) || null,
        })),
    ];

    const seen = new Set();
    const deduped = combined.filter(s => {
      if (seen.has(s.id)) return false;
      seen.add(s.id);
      return true;
    }).slice(0, limit);

    const hasExactMatch = deduped.some(s => s.name.toLowerCase() === qLower);

    return NextResponse.json({ skills: deduped, source: 'search', hasExactMatch, searchTerm: q });
  } catch (err) {
    console.error('[skills/search GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

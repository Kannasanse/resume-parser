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
      // Return ALL active skills so the lookup shows the full library
      let query = supabase
        .from('skills').select(SELECT).eq('is_active', true)
        .order('name', { ascending: true })
        .limit(1000);
      if (category !== 'all') query = query.eq('category', category);
      const { data, error } = await query;
      if (error) throw error;
      return NextResponse.json({
        skills: (data || []).map(s => ({ ...s, matchedAlias: null })),
        source: 'all', hasExactMatch: false, searchTerm: '',
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
      .contains('aliases', [q]).limit(10);
    if (category !== 'all') aliasQuery = aliasQuery.eq('category', category);
    const { data: aliasData } = await aliasQuery;

    // 3. Fuzzy alias text match
    let fuzzyQuery = supabase
      .from('skills').select(SELECT).eq('is_active', true)
      .filter('aliases::text', 'ilike', `%${q}%`).limit(10);
    if (category !== 'all') fuzzyQuery = fuzzyQuery.eq('category', category);
    const { data: fuzzyData } = await fuzzyQuery;

    // 4. Topic name match — find skill_ids whose topics match, then fetch those skills
    const { data: topicRows } = await supabase
      .from('skill_topics').select('skill_id').ilike('name', `%${q}%`).eq('is_active', true);
    const topicSkillIds = [...new Set((topicRows || []).map(r => r.skill_id))];
    let topicData = [];
    if (topicSkillIds.length) {
      let topicSkillQuery = supabase
        .from('skills').select(SELECT).eq('is_active', true).in('id', topicSkillIds);
      if (category !== 'all') topicSkillQuery = topicSkillQuery.eq('category', category);
      const { data: ts } = await topicSkillQuery;
      topicData = ts || [];
    }

    // Merge + deduplicate, attach matchedAlias / matchedTopic flags
    const nameIds  = new Set((nameData  || []).map(s => s.id));
    const aliasIds = new Set((aliasData || []).map(s => s.id));
    const fuzzyIds = new Set((fuzzyData || []).map(s => s.id));
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
      ...(topicData)
        .filter(s => !nameIds.has(s.id) && !aliasIds.has(s.id) && !fuzzyIds.has(s.id))
        .map(s => ({ ...s, matchedAlias: null, matchedTopic: true })),
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

import supabase from '@/lib/supabase.js';

const SELECT = 'id, name, slug, aliases';

/**
 * Try to find an existing skill matching name via slug, aliases, or similarity.
 * Returns { skill, reason } or null.
 */
export async function findExistingByAlias(name) {
  if (!name?.trim()) return null;
  const normalised = name.toLowerCase().trim();
  const slug = normalised.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // 1. Exact slug match
  const { data: bySlug } = await supabase
    .from('skills').select(SELECT)
    .eq('slug', slug).eq('is_active', true)
    .maybeSingle();
  if (bySlug) return { skill: bySlug, reason: 'slug_match' };

  // 2. Exact alias array contains (case-sensitive)
  const { data: byAlias } = await supabase
    .from('skills').select(SELECT)
    .contains('aliases', [name]).eq('is_active', true)
    .maybeSingle();
  if (byAlias) return { skill: byAlias, reason: 'alias_match' };

  // 3. Case-insensitive alias text search
  const { data: fuzzyRows } = await supabase
    .from('skills').select(SELECT)
    .filter('aliases::text', 'ilike', `%${normalised}%`)
    .eq('is_active', true).limit(1);
  if (fuzzyRows?.length) return { skill: fuzzyRows[0], reason: 'fuzzy_alias_match' };

  // 4. Trigram similarity on name (requires pg_trgm + find_similar_skill fn)
  try {
    const { data: simRows } = await supabase
      .rpc('find_similar_skill', { input_name: normalised, threshold: 0.7 });
    if (simRows?.length) return { skill: simRows[0], reason: 'similarity_match' };
  } catch {
    // pg_trgm not available — skip
  }

  return null;
}

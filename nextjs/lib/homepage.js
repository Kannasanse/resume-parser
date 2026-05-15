import supabase from './supabase.js';

// ── Public read (visible sections only, ordered) ──────────────────────────────

export async function getHomepageSections() {
  const { data, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .eq('is_visible', true)
    .order('sort_order', { ascending: true });
  if (error) { console.error('[homepage] getHomepageSections:', error.message); return []; }
  return data || [];
}

// ── Admin read (all sections, including hidden) ───────────────────────────────

export async function getAllHomepageSections() {
  const { data, error } = await supabase
    .from('homepage_sections')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) { console.error('[homepage] getAllHomepageSections:', error.message); return []; }
  return data || [];
}

// ── Admin write: upsert a single section ──────────────────────────────────────

export async function upsertSection(section) {
  const { error } = await supabase
    .from('homepage_sections')
    .upsert({
      id:           section.id,
      section_key:  section.section_key,
      section_type: section.section_type,
      title:        section.title        ?? null,
      subtitle:     section.subtitle     ?? null,
      overline:     section.overline     ?? null,
      is_visible:   section.is_visible   ?? true,
      sort_order:   section.sort_order,
      content:      section.content      ?? {},
      updated_at:   new Date().toISOString(),
      updated_by:   section.updated_by   ?? null,
    }, { onConflict: 'section_key' });
  if (error) { console.error('[homepage] upsertSection error:', error); throw new Error(error.message); }
}

// ── Admin write: batch upsert all sections + log publish ──────────────────────

export async function publishHomepage(sections, userId) {
  const now = new Date().toISOString();

  // 1. Batch upsert all sections — explicit field list so is_visible is never dropped
  const rows = sections.map(s => ({
    id:           s.id,
    section_key:  s.section_key,
    section_type: s.section_type,
    title:        s.title        ?? null,
    subtitle:     s.subtitle     ?? null,
    overline:     s.overline     ?? null,
    is_visible:   s.is_visible   ?? true,
    sort_order:   s.sort_order,
    content:      s.content      ?? {},
    updated_at:   now,
    updated_by:   userId,
  }));

  console.log('[homepage] publishing rows:', rows.map(r => ({ key: r.section_key, is_visible: r.is_visible })));

  const { error: upsertErr } = await supabase
    .from('homepage_sections')
    .upsert(rows, { onConflict: 'section_key' });
  if (upsertErr) { console.error('[homepage] publish upsert error:', upsertErr); throw new Error(upsertErr.message); }

  // 2. Insert publish log entry
  const { error: logErr } = await supabase
    .from('homepage_publish_log')
    .insert({ published_by: userId, snapshot: rows });
  if (logErr) console.error('[homepage] publish log insert:', logErr.message); // non-fatal

  return { published_at: now };
}

// ── Admin read: most recent publish log ───────────────────────────────────────

export async function getLastPublished() {
  const { data, error } = await supabase
    .from('homepage_publish_log')
    .select('published_at, published_by')
    .order('published_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) return null;
  return data;
}

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
    .upsert({ ...section, updated_at: new Date().toISOString() }, { onConflict: 'section_key' });
  if (error) throw new Error(error.message);
}

// ── Admin write: batch upsert all sections + log publish ──────────────────────

export async function publishHomepage(sections, userId) {
  const now = new Date().toISOString();

  // 1. Batch upsert all sections
  const rows = sections.map(s => ({ ...s, updated_at: now, updated_by: userId }));
  const { error: upsertErr } = await supabase
    .from('homepage_sections')
    .upsert(rows, { onConflict: 'section_key' });
  if (upsertErr) throw new Error(upsertErr.message);

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

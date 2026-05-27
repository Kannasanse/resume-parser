import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

function toSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function parseBool(val, def = true) {
  if (val === undefined || val === null || val === '') return def;
  if (typeof val === 'boolean') return val;
  return !['false', '0', 'no'].includes(String(val).toLowerCase());
}

function parseAliases(val) {
  if (!val) return null;
  if (Array.isArray(val)) {
    const arr = val.map(a => String(a).trim()).filter(Boolean);
    return arr.length ? arr : null;
  }
  const parts = String(val).split(/[|;]/).map(a => a.trim()).filter(Boolean);
  return parts.length ? parts : null;
}

function parseTopics(val) {
  if (!val) return [];
  if (Array.isArray(val)) {
    return val
      .map(t => (typeof t === 'string' ? { name: t.trim() } : t))
      .filter(t => t && (t.name || '').trim());
  }
  return String(val).split(/[|;]/).map(t => t.trim()).filter(Boolean).map(t => ({ name: t }));
}

function splitCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return [];
  const headers = splitCSVLine(lines[0]).map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));
  return lines.slice(1).map(line => {
    const values = splitCSVLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = (values[i] || '').trim(); });
    return row;
  });
}

function parseJSON(text) {
  const data = JSON.parse(text);
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.skills)) return data.skills;
  throw new Error('JSON must be an array or { "skills": [...] }');
}

async function getAdminUser(request) {
  let user;
  try {
    ({ user } = await requireUser(request));
  } catch (err) {
    if (err instanceof Response) throw err;
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    throw NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
  }
  return { user };
}

// POST /api/v1/admin/skills/import
// Body: multipart/form-data with a single `file` field (.json or .csv)
export async function POST(request) {
  try {
    await getAdminUser(request);

    const formData = await request.formData();
    const file = formData.get('file');
    if (!file) return NextResponse.json({ error: 'No file provided.' }, { status: 400 });

    const filename = typeof file.name === 'string' ? file.name : '';
    const text = await file.text();

    let rows;
    try {
      const looksJSON = text.trimStart().startsWith('[') || text.trimStart().startsWith('{');
      if (filename.endsWith('.json') || looksJSON) {
        rows = parseJSON(text);
      } else {
        rows = parseCSV(text);
      }
    } catch (err) {
      return NextResponse.json({ error: `Parse error: ${err.message}` }, { status: 400 });
    }

    if (!rows.length) {
      return NextResponse.json({ error: 'File contains no data rows.' }, { status: 400 });
    }

    // Load existing skills to detect name/slug conflicts
    const { data: existingSkills } = await supabase.from('skills').select('id, name, slug');
    const existingSlugs    = new Set((existingSkills || []).map(s => s.slug));
    const existingByNameLC = new Map((existingSkills || []).map(s => [s.name.toLowerCase(), s.id]));

    const results    = [];
    const toInsert   = [];
    const toUpdate   = []; // { id, name, skillData }
    const topicsByName = new Map(); // name (original case) → parsed topics

    const now = new Date().toISOString();

    for (const row of rows) {
      const name = (row.name || '').trim();
      if (!name) {
        results.push({ name: '', status: 'failed', reason: 'name is required' });
        continue;
      }

      const topics = parseTopics(row.topics);
      const skillData = {
        category:    (row.category || '').trim() || null,
        subcategory: (row.subcategory || '').trim() || null,
        aliases:     parseAliases(row.aliases),
        description: (row.description || '').trim() || null,
        icon_url:    (row.icon_url || row.iconUrl || '').trim() || null,
        is_active:   parseBool(row.is_active ?? row.isActive, true),
        is_trending: parseBool(row.is_trending ?? row.isTrending, false),
        updated_at:  now,
      };

      if (existingByNameLC.has(name.toLowerCase())) {
        // Existing skill — queue for update
        const existingId = existingByNameLC.get(name.toLowerCase());
        toUpdate.push({ id: existingId, name, skillData });
        if (topics.length) topicsByName.set(name, topics);
        results.push({ name, status: 'pending_update' });
      } else {
        // New skill — generate unique slug
        let base = (row.slug || '').trim() || toSlug(name);
        let slug = base;
        let suffix = 1;
        while (existingSlugs.has(slug)) slug = `${base}-${suffix++}`;
        existingSlugs.add(slug);
        existingByNameLC.set(name.toLowerCase(), '__pending__');

        toInsert.push({ name, slug, ...skillData, source: 'import', created_at: now });
        if (topics.length) topicsByName.set(name, topics);
        results.push({ name, status: 'pending' });
      }
    }

    let imported = 0;
    let updated  = 0;
    let topicsImported = 0;

    // ── INSERT new skills ──────────────────────────────────────────────────────
    if (toInsert.length) {
      const { data: inserted, error } = await supabase
        .from('skills').insert(toInsert).select('id, name');

      if (error) {
        results.forEach(r => {
          if (r.status === 'pending') { r.status = 'failed'; r.reason = error.message; }
        });
      } else {
        const insertedMap = new Map((inserted || []).map(s => [s.name.toLowerCase(), s.id]));
        results.forEach(r => {
          if (r.status === 'pending') {
            if (insertedMap.has(r.name.toLowerCase())) { r.status = 'imported'; imported++; }
            else { r.status = 'failed'; r.reason = 'Insert did not complete'; }
          }
        });

        // Topics for newly inserted skills
        const topicRows = [];
        for (const [nameLower, id] of insertedMap) {
          const origName = [...topicsByName.keys()].find(k => k.toLowerCase() === nameLower);
          const topics = origName ? topicsByName.get(origName) : [];
          topics.forEach((topic, i) => topicRows.push({
            skill_id: id, name: topic.name, slug: toSlug(topic.name),
            description: topic.description || null, sort_order: i, is_active: true,
          }));
        }
        if (topicRows.length) {
          const { data: t, error: te } = await supabase.from('skill_topics').insert(topicRows).select('id');
          if (te) console.error('[skills/import] topic insert error:', te.message);
          else topicsImported += t?.length ?? 0;
        }
      }
    }

    // ── UPDATE existing skills (parallel) ─────────────────────────────────────
    if (toUpdate.length) {
      const updateResults = await Promise.all(
        toUpdate.map(async ({ id, name, skillData }) => {
          const { error } = await supabase.from('skills').update(skillData).eq('id', id);
          return { id, name, error };
        })
      );

      // Sync topics for each updated skill (delete old → insert new)
      const topicSyncPromises = updateResults
        .filter(r => !r.error)
        .map(async ({ id, name }) => {
          const topics = topicsByName.get(name) ?? [];
          // Always replace topics when the skill is updated
          await supabase.from('skill_topics').delete().eq('skill_id', id);
          if (topics.length) {
            const rows = topics.map((topic, i) => ({
              skill_id: id, name: topic.name, slug: toSlug(topic.name),
              description: topic.description || null, sort_order: i, is_active: true,
            }));
            const { data: t, error: te } = await supabase.from('skill_topics').insert(rows).select('id');
            if (te) console.error('[skills/import] topic update error:', te.message);
            else return t?.length ?? 0;
          }
          return 0;
        });

      const topicCounts = await Promise.all(topicSyncPromises);
      topicsImported += topicCounts.reduce((a, b) => a + b, 0);

      const errorMap = new Map(updateResults.map(r => [r.name.toLowerCase(), r.error?.message]));
      results.forEach(r => {
        if (r.status === 'pending_update') {
          const err = errorMap.get(r.name.toLowerCase());
          if (err) { r.status = 'failed'; r.reason = err; }
          else { r.status = 'updated'; updated++; }
        }
      });
    }

    const failed = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({ imported, updated, failed, topics_imported: topicsImported, results });
  } catch (err) {
    if (err instanceof Response || err instanceof NextResponse) return err;
    console.error('[admin/skills/import POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

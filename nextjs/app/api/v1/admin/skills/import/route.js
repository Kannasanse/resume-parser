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
    const existingSlugs = new Set((existingSkills || []).map(s => s.slug));
    const existingNamesLower = new Map((existingSkills || []).map(s => [s.name.toLowerCase(), s.id]));

    const results = [];
    const toInsert = [];

    for (const row of rows) {
      const name = (row.name || '').trim();

      if (!name) {
        results.push({ name: '', status: 'failed', reason: 'name is required' });
        continue;
      }

      if (existingNamesLower.has(name.toLowerCase())) {
        results.push({ name, status: 'skipped', reason: 'already exists' });
        continue;
      }

      // Generate unique slug
      let base = (row.slug || '').trim() || toSlug(name);
      let slug = base;
      let suffix = 1;
      while (existingSlugs.has(slug)) slug = `${base}-${suffix++}`;

      // Reserve in-memory so duplicates within this batch are caught
      existingSlugs.add(slug);
      existingNamesLower.set(name.toLowerCase(), '__pending__');

      toInsert.push({
        name,
        slug,
        category: (row.category || '').trim() || null,
        subcategory: (row.subcategory || '').trim() || null,
        aliases: parseAliases(row.aliases),
        description: (row.description || '').trim() || null,
        icon_url: (row.icon_url || row.iconUrl || '').trim() || null,
        is_active: parseBool(row.is_active ?? row.isActive, true),
        is_trending: parseBool(row.is_trending ?? row.isTrending, false),
        source: 'import',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      results.push({ name, status: 'pending' });
    }

    let imported = 0;
    if (toInsert.length) {
      const { data: inserted, error } = await supabase
        .from('skills').insert(toInsert).select('id, name');

      if (error) {
        results.forEach(r => {
          if (r.status === 'pending') { r.status = 'failed'; r.reason = error.message; }
        });
      } else {
        const insertedNames = new Set((inserted || []).map(s => s.name.toLowerCase()));
        results.forEach(r => {
          if (r.status === 'pending') {
            if (insertedNames.has(r.name.toLowerCase())) {
              r.status = 'imported';
              imported++;
            } else {
              r.status = 'failed';
              r.reason = 'Insert did not complete';
            }
          }
        });
      }
    }

    const skipped = results.filter(r => r.status === 'skipped').length;
    const failed  = results.filter(r => r.status === 'failed').length;

    return NextResponse.json({ imported, skipped, failed, results });
  } catch (err) {
    if (err instanceof Response || err instanceof NextResponse) return err;
    console.error('[admin/skills/import POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

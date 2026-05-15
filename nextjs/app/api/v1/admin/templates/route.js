import { requireAdmin } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { TEMPLATES } from '@/components/builder/templates.js';

export const dynamic = 'force-dynamic';

// GET /api/v1/admin/templates
// Returns all templates with their featured status from the DB.
export async function GET(req) {
  try {
    await requireAdmin(req);
  } catch (e) { return e; }

  const { data: settings, error } = await supabase
    .from('template_settings')
    .select('template_id, featured, updated_at');

  if (error) return Response.json({ error: error.message }, { status: 500 });

  const settingsMap = Object.fromEntries(
    (settings || []).map(s => [s.template_id, s])
  );

  const templates = TEMPLATES.map(t => ({
    ...t,
    featured:   settingsMap[t.id]?.featured ?? false,
    updated_at: settingsMap[t.id]?.updated_at ?? null,
  }));

  return Response.json({ templates });
}

// PATCH /api/v1/admin/templates
// Body: { template_id: string, featured: boolean }
export async function PATCH(req) {
  try {
    await requireAdmin(req);
  } catch (e) { return e; }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.template_id !== 'string' || typeof body.featured !== 'boolean') {
    return Response.json({ error: 'template_id (string) and featured (boolean) required' }, { status: 400 });
  }

  const { template_id, featured } = body;

  if (!TEMPLATES.find(t => t.id === template_id)) {
    return Response.json({ error: 'Unknown template' }, { status: 404 });
  }

  const { error } = await supabase
    .from('template_settings')
    .upsert({ template_id, featured, updated_at: new Date().toISOString() }, { onConflict: 'template_id' });

  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ template_id, featured });
}

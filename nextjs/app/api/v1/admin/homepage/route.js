import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/auth-helpers.js';
import { getAllHomepageSections, publishHomepage, getLastPublished, upsertSection } from '@/lib/homepage.js';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET — fetch all sections (including hidden) for the admin CMS
export async function GET(req) {
  let user;
  try { ({ user } = await requireAdmin(req)); } catch (e) { return e; }

  const [sections, lastPublished] = await Promise.all([
    getAllHomepageSections(),
    getLastPublished(),
  ]);

  return Response.json({ sections, lastPublished });
}

// PUT — save draft (batch upsert, no publish log)
export async function PUT(req) {
  let user;
  try { ({ user } = await requireAdmin(req)); } catch (e) { return e; }

  const body = await req.json().catch(() => null);
  if (!body?.sections || !Array.isArray(body.sections)) {
    return Response.json({ error: 'sections array required' }, { status: 400 });
  }

  try {
    const now = new Date().toISOString();
    for (const s of body.sections) {
      await upsertSection({ ...s, updated_by: user.id, updated_at: now });
    }
    return Response.json({ saved: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST — publish (batch upsert + publish log + revalidate)
export async function POST(req) {
  let user;
  try { ({ user } = await requireAdmin(req)); } catch (e) { return e; }

  const body = await req.json().catch(() => null);
  if (!body?.sections || !Array.isArray(body.sections)) {
    return Response.json({ error: 'sections array required' }, { status: 400 });
  }

  try {
    const result = await publishHomepage(body.sections, user.id);
    if (body.sectionsToDelete?.length) {
      const { error: delErr } = await supabase
        .from('homepage_sections')
        .delete()
        .in('section_key', body.sectionsToDelete);
      if (delErr) console.warn('[homepage] delete sections error:', delErr.message);
    }
    revalidatePath('/home');
    return Response.json({ published: true, published_at: result.published_at });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

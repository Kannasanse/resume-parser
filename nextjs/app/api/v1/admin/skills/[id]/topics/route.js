import supabase from '@/lib/supabase.js';
import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await requireAdmin(request);
    const { id } = params;

    const { data, error } = await supabase
      .from('skill_topics')
      .select('id, name, slug, description, is_active, sort_order, created_at')
      .eq('skill_id', id)
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) throw error;
    return Response.json({ topics: data || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAdmin(request);
    const { id } = params;
    const body = await request.json();

    const name = body.name?.trim();
    if (!name) return Response.json({ error: 'name is required' }, { status: 400 });

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

    const { data, error } = await supabase
      .from('skill_topics')
      .insert({
        skill_id: id,
        name,
        slug,
        description: body.description?.trim() || null,
        is_active: body.is_active !== false,
        sort_order: body.sort_order ?? 0,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') return Response.json({ error: 'Topic already exists for this skill' }, { status: 409 });
      throw error;
    }

    return Response.json({ topic: data }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

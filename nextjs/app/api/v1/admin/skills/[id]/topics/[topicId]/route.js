import supabase from '@/lib/supabase.js';
import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function DELETE(request, { params }) {
  try {
    await requireAdmin(request);
    const { id, topicId } = params;

    const { error } = await supabase
      .from('skill_topics')
      .delete()
      .eq('id', topicId)
      .eq('skill_id', id);

    if (error) throw error;
    return new Response(null, { status: 204 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    await requireAdmin(request);
    const { id, topicId } = params;
    const body = await request.json();

    const updates = {};
    if (body.name !== undefined) {
      updates.name = body.name.trim();
      updates.slug = updates.name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    }
    if (body.description !== undefined) updates.description = body.description?.trim() || null;
    if (body.is_active !== undefined) updates.is_active = body.is_active;
    if (body.sort_order !== undefined) updates.sort_order = body.sort_order;

    const { data, error } = await supabase
      .from('skill_topics')
      .update(updates)
      .eq('id', topicId)
      .eq('skill_id', id)
      .select()
      .single();

    if (error) throw error;
    return Response.json({ topic: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

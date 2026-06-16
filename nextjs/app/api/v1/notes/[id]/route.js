import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    const { data: note, error } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !note) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    return Response.json({ note });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    // Verify ownership
    const { data: existing, error: fetchErr } = await supabase
      .from('notes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !existing) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    const allowedFields = ['title', 'content', 'word_count', 'icon', 'cover_url'];
    const updates = {};
    for (const field of allowedFields) {
      if (field in body) updates[field] = body[field];
    }

    if (Object.keys(updates).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: note, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    return Response.json({ note });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    const { data: existing, error: fetchErr } = await supabase
      .from('notes')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !existing) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    const { error } = await supabase
      .from('notes')
      .update({ is_archived: true })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

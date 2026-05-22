import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const { parent_id } = body;

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

    // If parent_id is provided, verify the parent belongs to the same user
    if (parent_id) {
      const { data: parent, error: parentErr } = await supabase
        .from('notes')
        .select('id')
        .eq('id', parent_id)
        .eq('user_id', user.id)
        .single();

      if (parentErr || !parent) {
        return Response.json({ error: 'Parent note not found' }, { status: 404 });
      }

      // Prevent moving a note into itself
      if (parent_id === id) {
        return Response.json({ error: 'Cannot move a note into itself' }, { status: 400 });
      }
    }

    const { data: note, error } = await supabase
      .from('notes')
      .update({ parent_id: parent_id || null })
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

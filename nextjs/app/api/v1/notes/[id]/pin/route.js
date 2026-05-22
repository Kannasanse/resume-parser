import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    // Fetch current state with ownership check
    const { data: existing, error: fetchErr } = await supabase
      .from('notes')
      .select('id, is_pinned')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !existing) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    const { data: note, error } = await supabase
      .from('notes')
      .update({ is_pinned: !existing.is_pinned })
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

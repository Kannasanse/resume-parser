import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    // Fetch original note with ownership check
    const { data: original, error: fetchErr } = await supabase
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !original) {
      return Response.json({ error: 'Note not found' }, { status: 404 });
    }

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: `Copy of ${original.title || 'Untitled'}`,
        content: original.content || null,
        icon: original.icon || null,
        cover_url: original.cover_url || null,
        context_type: original.context_type || null,
        context_id: original.context_id || null,
        parent_id: original.parent_id || null,
        sort_order: (original.sort_order || 0) + 1,
        is_pinned: false,
        is_archived: false,
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ note }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

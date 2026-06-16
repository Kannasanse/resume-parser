import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    // Find notes whose content JSONB contains a wikilink to this note
    const { data, error } = await supabase
      .from('notes')
      .select('id, title, updated_at')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .neq('id', id)
      .filter('content', 'cs', JSON.stringify([{ type: 'wikilink', attrs: { noteId: id } }]));

    if (error) return Response.json({ backlinks: [] });
    return Response.json({ backlinks: data || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

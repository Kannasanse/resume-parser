import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await requireUser(request);
    const { searchParams } = new URL(request.url);
    const q     = (searchParams.get('q') || '').trim();
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50);

    if (q.length < 2) return Response.json({ results: [] });

    // Try full-text search on the existing GIN index; fall back to ilike
    let results = [];
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id, title, tags, updated_at, parent_id, icon')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .textSearch('title', q, { type: 'plain', config: 'english' })
        .order('updated_at', { ascending: false })
        .limit(limit);
      if (!error) results = data || [];
    } catch { /* fall through */ }

    if (results.length === 0) {
      const { data } = await supabase
        .from('notes')
        .select('id, title, tags, updated_at, parent_id, icon')
        .eq('user_id', user.id)
        .eq('is_archived', false)
        .ilike('title', `%${q}%`)
        .order('updated_at', { ascending: false })
        .limit(limit);
      results = data || [];
    }

    return Response.json({ results });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

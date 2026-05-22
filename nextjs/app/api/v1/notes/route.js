import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await requireUser(request);
    const { searchParams } = new URL(request.url);

    const context_type = searchParams.get('context_type');
    const context_id = searchParams.get('context_id');
    const search = searchParams.get('search');
    const sort = searchParams.get('sort') || 'updated_at';
    const archived = searchParams.get('archived') === 'true';

    const validSorts = ['updated_at', 'title', 'created_at', 'word_count'];
    const sortColumn = validSorts.includes(sort) ? sort : 'updated_at';

    let query = supabase
      .from('notes')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_archived', archived)
      .order(sortColumn, { ascending: sortColumn === 'title' });

    if (context_type) query = query.eq('context_type', context_type);
    if (context_id) query = query.eq('context_id', context_id);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: notes, error } = await query;
    if (error) throw error;

    return Response.json({ notes });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const body = await request.json().catch(() => ({}));

    const { title, content, icon, context_type, context_id, parent_id } = body;

    const { data: note, error } = await supabase
      .from('notes')
      .insert({
        user_id: user.id,
        title: title || 'Untitled',
        content: content || null,
        icon: icon || null,
        context_type: context_type || null,
        context_id: context_id || null,
        parent_id: parent_id || null,
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

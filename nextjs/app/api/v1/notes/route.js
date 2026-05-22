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
    const parent_id = searchParams.get('parent_id'); // 'root' = null parent, UUID = specific parent

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
    if (parent_id === 'root') query = query.is('parent_id', null);
    else if (parent_id) query = query.eq('parent_id', parent_id);

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }

    const { data: notes, error } = await query;
    if (error) throw error;

    // Compute child_count for each note efficiently
    const { data: childRows } = await supabase
      .from('notes')
      .select('parent_id')
      .eq('user_id', user.id)
      .eq('is_archived', false)
      .not('parent_id', 'is', null);

    const countMap = {};
    childRows?.forEach(r => {
      countMap[r.parent_id] = (countMap[r.parent_id] || 0) + 1;
    });

    const notesWithCounts = notes.map(n => ({ ...n, child_count: countMap[n.id] || 0 }));

    return Response.json({ notes: notesWithCounts });
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
        content: content || { type: 'doc', content: [] },
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

import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    const { user } = await requireUser(request);
    const { data, error } = await supabase
      .from('note_tags')
      .select('*')
      .eq('user_id', user.id)
      .order('usage_count', { ascending: false });
    if (error) throw error;
    return Response.json({ tags: data || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { slug, label, color } = await request.json().catch(() => ({}));
    if (!slug || !label) return Response.json({ error: 'slug and label required' }, { status: 400 });
    const { data, error } = await supabase
      .from('note_tags')
      .upsert(
        { user_id: user.id, slug: slug.toLowerCase(), label, color: color || '#185FA5' },
        { onConflict: 'user_id,slug' }
      )
      .select()
      .single();
    if (error) throw error;
    return Response.json({ tag: data }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { token } = await params;
    if (!token) return Response.json({ error: 'Token required' }, { status: 400 });

    const { data: note, error } = await supabase
      .from('notes')
      .select('id, title, content, tags, updated_at, icon, cover_url')
      .eq('share_token', token)
      .eq('is_public', true)
      .single();

    if (error || !note) return Response.json({ error: 'Note not found' }, { status: 404 });
    return Response.json({ note });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

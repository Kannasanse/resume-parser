import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { kitId } = await params;

    const { data: kit, error } = await supabase
      .from('interview_kits')
      .select('*')
      .eq('id', kitId)
      .eq('user_id', user.id)
      .single();

    if (error || !kit) return Response.json({ error: 'Not found' }, { status: 404 });

    // Update last_viewed_at
    supabase.from('interview_kits')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', kitId)
      .then(() => {});

    return Response.json({ kit });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { kitId } = await params;

    const { error } = await supabase
      .from('interview_kits')
      .delete()
      .eq('id', kitId)
      .eq('user_id', user.id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

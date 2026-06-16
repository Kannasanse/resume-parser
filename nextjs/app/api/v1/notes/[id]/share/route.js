import { requireUser } from '@/lib/auth-helpers';
import supabase from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function generateToken() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  }
  // Node.js server fallback
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('crypto').randomBytes(8).toString('hex');
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;
    const { is_public, regenerate_token } = await request.json().catch(() => ({}));

    const { data: note, error: fetchErr } = await supabase
      .from('notes')
      .select('id, share_token, is_public')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !note) return Response.json({ error: 'Note not found' }, { status: 404 });

    const update = {};
    if (is_public === true) {
      update.is_public = true;
      if (!note.share_token || regenerate_token) update.share_token = generateToken();
    } else if (is_public === false) {
      update.is_public = false;
      if (regenerate_token) update.share_token = generateToken();
    }

    const { data: updated, error: upErr } = await supabase
      .from('notes')
      .update(update)
      .eq('id', id)
      .eq('user_id', user.id)
      .select('id, is_public, share_token')
      .single();

    if (upErr) throw upErr;
    return Response.json({ note: updated });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

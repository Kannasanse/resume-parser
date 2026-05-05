import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAdmin(request);
    const { id: test_id, lid } = await params;
    const { action } = await request.json();

    const { data: link } = await supabase
      .from('test_links')
      .select('id, status')
      .eq('id', lid)
      .eq('test_id', test_id)
      .single();

    if (!link) return Response.json({ error: 'Link not found' }, { status: 404 });
    if (link.status === 'completed') return Response.json({ error: 'Cannot modify a completed test link' }, { status: 409 });

    if (action === 'revoke') {
      const { data, error } = await supabase
        .from('test_links')
        .update({ status: 'revoked' })
        .eq('id', lid)
        .select()
        .single();
      if (error) throw error;

      await auditLog({ performedBy: user.id, action: 'test.link.revoke', details: { link_id: lid, test_id } });

      return Response.json({ link: data });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

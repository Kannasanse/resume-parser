import supabase from '@/lib/supabase.js';
import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

// POST body: { order: [{ id, position }] }
export async function POST(request, { params }) {
  try {
    await requireAdmin(request);
    const { id: test_id } = await params;
    const { order } = await request.json();

    if (!Array.isArray(order)) return Response.json({ error: 'order must be an array' }, { status: 400 });

    // Verify all questions belong to this test
    const ids = order.map(o => o.id);
    const { data: existing } = await supabase
      .from('test_questions')
      .select('id')
      .eq('test_id', test_id)
      .in('id', ids);

    if (!existing || existing.length !== ids.length) {
      return Response.json({ error: 'Some questions do not belong to this test' }, { status: 400 });
    }

    // Update positions
    await Promise.all(
      order.map(({ id, position }) =>
        supabase.from('test_questions').update({ position, updated_at: new Date().toISOString() }).eq('id', id)
      )
    );

    return Response.json({ message: 'Questions reordered' });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

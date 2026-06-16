import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function DELETE(request) {
  try {
    const { user } = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { ids } = body || {};

    if (!Array.isArray(ids) || ids.length === 0) {
      return Response.json({ error: 'ids must be a non-empty array' }, { status: 400 });
    }
    if (ids.length > 100) {
      return Response.json({ error: 'Maximum 100 ids per request' }, { status: 400 });
    }

    // Check if any ids are used in published tests (guard missing tables with try/catch)
    if (!force) {
      try {
        const { data: usedRows, error: usedErr } = await supabase
          .from('test_questions')
          .select('question_id, tests!inner(status)')
          .in('question_id', ids)
          .eq('tests.status', 'published');

        if (!usedErr && usedRows && usedRows.length > 0) {
          const usedIds = [...new Set(usedRows.map(r => r.question_id))];
          return Response.json(
            { error: 'SOME_IN_PUBLISHED', count: usedIds.length, ids: usedIds },
            { status: 409 }
          );
        }
      } catch {
        // If the join fails (table/column missing), proceed with deletion
      }
    }

    // Delete options first to respect FK constraints
    const { error: optErr } = await supabase
      .from('question_library_options')
      .delete()
      .in('question_id', ids);

    if (optErr) {
      // Non-fatal if the table doesn't exist or rows are absent
      console.warn('bulk delete options warning:', optErr.message);
    }

    const { error: delErr, count } = await supabase
      .from('question_library')
      .delete({ count: 'exact' })
      .in('id', ids);

    if (delErr) throw delErr;

    await auditLog({
      performedBy: user.id,
      action: 'question_library.bulk_delete',
      details: { ids, deleted: count ?? ids.length, force },
    });

    return Response.json({ deleted: count ?? ids.length });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

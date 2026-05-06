import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user: admin } = await requireAdmin(request);
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);

    const mode  = searchParams.get('mode') || 'all';
    const from  = searchParams.get('from') || null;
    const to    = searchParams.get('to')   || null;
    const page  = Math.max(1, parseInt(searchParams.get('page'))  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || 20));
    const sort  = searchParams.get('sort') || 'created_at';
    const dir   = searchParams.get('dir')  === 'asc' ? 'asc' : 'desc';

    // Verify user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (!targetUser) return Response.json({ error: 'User not found.' }, { status: 404 });

    // Fetch sessions with latest attempt
    let query = supabase
      .from('self_test_sessions')
      .select(`
        id, input_type, difficulty, question_count, created_at, status,
        self_test_attempts(score, max_score, submitted_at, auto_submitted)
      `)
      .eq('user_id', userId);

    if (mode !== 'all') query = query.eq('input_type', mode);
    if (from) query = query.gte('created_at', from);
    if (to)   query = query.lte('created_at', to + 'T23:59:59.999Z');

    const { data: raw, error: sErr } = await query
      .order('created_at', { ascending: false })
      .limit(1000);
    if (sErr) throw sErr;

    // Flatten and compute derived fields
    const sessions = (raw || []).map(s => {
      const attempt = Array.isArray(s.self_test_attempts) ? s.self_test_attempts[0] : null;
      const pct = attempt?.max_score > 0
        ? Math.round((attempt.score / attempt.max_score) * 100)
        : null;
      return {
        id:             s.id,
        input_type:     s.input_type,
        difficulty:     s.difficulty,
        question_count: s.question_count,
        created_at:     s.created_at,
        status:         attempt?.submitted_at ? 'completed' : 'abandoned',
        score:          attempt?.score    ?? null,
        max_score:      attempt?.max_score ?? null,
        pct,
        submitted_at:   attempt?.submitted_at   ?? null,
        auto_submitted: attempt?.auto_submitted  ?? false,
      };
    });

    // Sort
    sessions.sort((a, b) => {
      let av, bv;
      if (sort === 'input_type')     { av = a.input_type;     bv = b.input_type; }
      else if (sort === 'question_count') { av = a.question_count; bv = b.question_count; }
      else if (sort === 'pct')       { av = a.pct ?? -1;      bv = b.pct ?? -1; }
      else if (sort === 'status')    { av = a.status;         bv = b.status; }
      else                           { av = a.created_at;     bv = b.created_at; }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ?  1 : -1;
      return 0;
    });

    const total     = sessions.length;
    const paginated = sessions.slice((page - 1) * limit, page * limit);

    await auditLog({
      performedBy: admin.id,
      action:      'viewed_self_test_list',
      targetUserId: userId,
      details:     { page, mode, from, to },
    });

    return Response.json({ sessions: paginated, total, page, limit });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

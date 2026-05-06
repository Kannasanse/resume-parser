import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user: admin } = await requireAdmin(request);
    const { id: userId, sessionId } = await params;

    const { data: session, error: sErr } = await supabase
      .from('self_test_sessions')
      .select('id, user_id, input_type, input_data, difficulty, question_count, questions, status, created_at, timer_minutes')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (sErr) throw sErr;
    if (!session) return Response.json({ error: 'Test not found.' }, { status: 404 });

    // Fetch jd_skills separately — graceful fallback if migration not yet applied
    let jd_skills = null;
    if (session.input_type === 'jd') {
      try {
        const { data: jdRow } = await supabase
          .from('self_test_sessions')
          .select('jd_skills')
          .eq('id', sessionId)
          .maybeSingle();
        jd_skills = jdRow?.jd_skills ?? null;
      } catch {}
    }

    const { data: attempt } = await supabase
      .from('self_test_attempts')
      .select('id, score, max_score, answers, results, submitted_at, auto_submitted, time_remaining_seconds')
      .eq('session_id', sessionId)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const pct = attempt?.max_score > 0
      ? Math.round((attempt.score / attempt.max_score) * 100)
      : null;

    // Per-skill breakdown for JD tests
    let per_skill = null;
    if (session.input_type === 'jd' && attempt?.results && session.questions?.length) {
      const map = {};
      session.questions.forEach((q, i) => {
        const skill = q.skill;
        if (!skill) return;
        if (!map[skill]) map[skill] = { correct: 0, total: 0 };
        map[skill].total++;
        if (attempt.results[i]?.correct) map[skill].correct++;
      });
      per_skill = Object.entries(map).map(([name, { correct, total }]) => ({
        name,
        type: jd_skills?.find(s => s.name === name)?.type ?? 'Hard',
        correct,
        total,
        pct: total > 0 ? Math.round((correct / total) * 100) : 0,
      })).sort((a, b) => b.pct - a.pct);
    }

    await auditLog({
      performedBy:  admin.id,
      action:       'viewed_self_test_detail',
      targetUserId: userId,
      details:      { session_id: sessionId },
    });

    return Response.json({
      session: {
        id:             session.id,
        user_id:        session.user_id,
        input_type:     session.input_type,
        jd_text:        session.input_type === 'jd' ? (session.input_data || null) : null,
        jd_skills,
        difficulty:     session.difficulty,
        question_count: session.question_count,
        timer_minutes:  session.timer_minutes,
        status:         attempt?.submitted_at ? 'completed' : 'abandoned',
        created_at:     session.created_at,
      },
      attempt: attempt ? {
        id:            attempt.id,
        score:         attempt.score,
        max_score:     attempt.max_score,
        pct,
        submitted_at:  attempt.submitted_at,
        auto_submitted: attempt.auto_submitted,
      } : null,
      per_skill,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

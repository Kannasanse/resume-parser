import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;
    const { answers = {}, time_remaining_seconds = 0, auto_submitted = false } = await request.json();

    const { data: session, error } = await supabase
      .from('self_test_sessions')
      .select('id, user_id, questions, status')
      .eq('id', id)
      .single();

    if (error || !session) return Response.json({ error: 'Test not found' }, { status: 404 });
    if (session.user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (session.status === 'completed') {
      return Response.json({ error: 'Test already submitted' }, { status: 409 });
    }

    const { score, maxScore, results } = calculateScore(session.questions, answers);

    const { data: attempt, error: aErr } = await supabase
      .from('self_test_attempts')
      .insert({
        session_id:             id,
        user_id:                user.id,
        submitted_at:           new Date().toISOString(),
        time_remaining_seconds: Math.max(0, parseInt(time_remaining_seconds) || 0),
        auto_submitted:         !!auto_submitted,
        answers,
        results,
        score,
        max_score: maxScore,
      })
      .select()
      .single();
    if (aErr) throw aErr;

    await supabase
      .from('self_test_sessions')
      .update({ status: 'completed' })
      .eq('id', id);

    return Response.json({
      attempt_id: attempt.id,
      score,
      max_score: maxScore,
      results,
      questions: session.questions,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

function calculateScore(questions, answers) {
  let score = 0;
  let maxScore = 0;

  const results = (questions || []).map((q, i) => {
    const pts = q.points || 1;
    maxScore += pts;
    const ans = answers[String(i)];
    let correct = false;

    if (q.type === 'mcq') {
      const idx = parseInt(ans);
      correct = !isNaN(idx) && q.options?.[idx]?.is_correct === true;
    } else if (q.type === 'true_false') {
      correct = ans === q.correct_answer;
    }

    if (correct) score += pts;

    return {
      correct,
      answer: ans ?? null,
      correct_index: q.type === 'mcq' ? q.options?.findIndex(o => o.is_correct) : undefined,
      correct_answer: q.type === 'true_false' ? q.correct_answer : undefined,
    };
  });

  return { score, maxScore, results };
}

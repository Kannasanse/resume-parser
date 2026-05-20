import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;
    const { question_index, correct } = await request.json();

    if (question_index == null || typeof correct !== 'boolean') {
      return Response.json({ error: 'question_index and correct (boolean) required' }, { status: 400 });
    }

    // Fetch attempt
    const { data: attempt } = await supabase
      .from('self_test_attempts')
      .select('id, results, score, max_score, short_answer_count, combined_pct')
      .eq('session_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!attempt) return Response.json({ error: 'Attempt not found' }, { status: 404 });

    const updatedResults = [...(attempt.results || [])];
    const qi = parseInt(question_index);
    if (!updatedResults[qi]) return Response.json({ error: 'Question not found' }, { status: 404 });

    const wasCorrect = updatedResults[qi].correct;
    updatedResults[qi] = {
      ...updatedResults[qi],
      correct,
      self_grade:     correct,
      grading_method: 'self',
      pending_grade:  false,
    };

    // Adjust score
    const pts = 2; // short answer points
    const scoreDelta = correct ? pts : (wasCorrect ? -pts : 0);
    const newScore = Math.max(0, (attempt.score || 0) + scoreDelta);

    // Recalculate self_graded_score
    const selfGradedCorrect = updatedResults.filter(r =>
      r.grading_method === 'self' && r.correct
    ).length;

    // Recalculate combined pct
    const saTotal = updatedResults.filter(r => r.question_type === 'short_answer').length;
    const saCorrect = updatedResults.filter(r => r.question_type === 'short_answer' && r.correct && !r.pending_grade).length;
    const mcqTotal  = updatedResults.filter(r => r.question_type !== 'short_answer').length;
    const mcqCorrect = updatedResults.filter(r => r.question_type !== 'short_answer' && r.correct).length;

    const mcqPct = mcqTotal > 0 ? (mcqCorrect / mcqTotal) * 100 : 0;
    const saPct  = saTotal  > 0 ? (saCorrect  / saTotal)  * 100 : 0;

    let combinedPct;
    if (mcqTotal > 0 && saTotal > 0) {
      combinedPct = Math.round(mcqPct * 0.6 + saPct * 0.4);
    } else if (saTotal > 0) {
      combinedPct = Math.round(saPct);
    } else {
      combinedPct = Math.round(mcqPct);
    }

    await supabase
      .from('self_test_attempts')
      .update({
        results:           updatedResults,
        score:             newScore,
        self_graded_score: selfGradedCorrect,
        combined_pct:      combinedPct,
        combined_score:    combinedPct,
      })
      .eq('id', attempt.id)
      .catch(() => {}); // non-fatal

    return Response.json({
      success: true,
      combined_pct: combinedPct,
      result: updatedResults[qi],
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const {
      sessionId,
      questionNumber,
      answerValue,
      answerLabel,
      confidenceAfter,
      shouldContinue,
    } = await request.json();

    // Verify ownership
    const { data: session } = await supabase
      .from('career_map_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const now = new Date().toISOString();

    // Update the question row with answer (non-fatal if migration not run)
    try {
      await supabase
        .from('career_map_questions')
        .update({
          answer_value:    answerValue,
          answer_label:    answerLabel,
          confidence_after: confidenceAfter,
          should_continue: shouldContinue,
          answered_at:     now,
        })
        .eq('session_id', sessionId)
        .eq('question_number', questionNumber);
    } catch (_) {}

    // Update session counters
    const sessionUpdate = {
      question_count:  questionNumber,
      updated_at:      now,
    };
    if (!shouldContinue) {
      sessionUpdate.questionnaire_complete = true;
      sessionUpdate.confidence_score       = confidenceAfter;
    }

    try {
      await supabase
        .from('career_map_sessions')
        .update(sessionUpdate)
        .eq('id', sessionId);
    } catch (_) {}

    return NextResponse.json({ saved: true, moveToRecommendations: !shouldContinue });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('submit-answer error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

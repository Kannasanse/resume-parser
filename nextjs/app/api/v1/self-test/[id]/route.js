import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    const { data: session, error } = await supabase
      .from('self_test_sessions')
      .select('id, input_type, input_data, difficulty, timer_minutes, questions, question_count, status, created_at, user_id')
      .eq('id', id)
      .single();

    if (error || !session) return Response.json({ error: 'Test not found' }, { status: 404 });
    if (session.user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch attempt if exists
    const { data: attempt } = await supabase
      .from('self_test_attempts')
      .select('id, score, max_score, answers, results, submitted_at, auto_submitted, time_remaining_seconds')
      .eq('session_id', id)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (attempt?.submitted_at) {
      // Return full questions for results display
      return Response.json({
        session: { id: session.id, input_type: session.input_type, input_data: session.input_data, difficulty: session.difficulty, timer_minutes: session.timer_minutes, question_count: session.question_count, status: session.status },
        questions: session.questions,
        attempt,
      });
    }

    // Strip correct answers during active test
    const stripped = (session.questions || []).map(q => {
      if (q.type === 'mcq') {
        return { ...q, options: q.options.map(o => ({ option_text: o.option_text })) };
      }
      if (q.type === 'true_false') {
        const { correct_answer: _, ...rest } = q;
        return rest;
      }
      return q;
    });

    return Response.json({
      session: { id: session.id, input_type: session.input_type, input_data: session.input_data, difficulty: session.difficulty, timer_minutes: session.timer_minutes, question_count: session.question_count, status: session.status },
      questions: stripped,
      attempt: null,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';
import { updateLibraryQuestionStats } from '@/lib/self-test/questionLibrary.js';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;
    const {
      answers = {},
      short_answers = [],   // [{ questionIndex, answerText, gradingMethod }]
      time_remaining_seconds = 0,
      auto_submitted = false,
    } = await request.json();

    const { data: session, error } = await supabase
      .from('self_test_sessions')
      .select('id, user_id, questions, status, grading_method')
      .eq('id', id)
      .single();

    if (error || !session) return Response.json({ error: 'Test not found' }, { status: 404 });
    if (session.user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (session.status === 'completed') {
      return Response.json({ error: 'Test already submitted' }, { status: 409 });
    }

    // Merge short_answer texts into answers map for unified storage
    const mergedAnswers = { ...answers };
    const shortAnswerMap = {};  // questionIndex -> { answerText, gradingMethod }
    for (const sa of short_answers) {
      mergedAnswers[String(sa.questionIndex)] = sa.answerText || '';
      shortAnswerMap[String(sa.questionIndex)] = {
        answerText:    sa.answerText || '',
        gradingMethod: 'ai',
      };
    }

    const { score, maxScore, results, saCount } = calculateScore(session.questions, mergedAnswers, shortAnswerMap);

    const attemptRow = {
      session_id:             id,
      user_id:                user.id,
      submitted_at:           new Date().toISOString(),
      time_remaining_seconds: Math.max(0, parseInt(time_remaining_seconds) || 0),
      auto_submitted:         !!auto_submitted,
      answers:                mergedAnswers,
      results,
      score,
      max_score:              maxScore,
      short_answer_count:     saCount,
    };

    // Score is MCQ/TF only — short answers are excluded from scoring
    const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
    attemptRow.combined_score = pct;
    attemptRow.combined_pct   = pct;

    const { data: attempt, error: aErr } = await supabase
      .from('self_test_attempts')
      .insert(attemptRow)
      .select()
      .single();
    if (aErr) {
      // Fallback: remove new columns if migration not run
      const { short_answer_count: _a, combined_score: _b, combined_pct: _c, ...compat } = attemptRow;
      const { data: a2, error: e2 } = await supabase
        .from('self_test_attempts')
        .insert(compat)
        .select()
        .single();
      if (e2) throw e2;
      Object.assign(attempt || {}, a2);
    }

    await supabase
      .from('self_test_sessions')
      .update({ status: 'completed' })
      .eq('id', id);

    // Fire-and-forget: update times_correct/times_incorrect for library questions
    updateLibraryQuestionStats(session.questions, results).catch(err => {
      console.error('[Library] Stats update failed:', err.message);
    });

    return Response.json({
      attempt_id: attempt?.id,
      score,
      max_score:  maxScore,
      results,
      questions:  session.questions,
      has_short_answers: saCount > 0,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

function calculateScore(questions, answers, shortAnswerMap = {}) {
  let score = 0;
  let maxScore = 0;
  let saCount = 0;

  const results = (questions || []).map((q, i) => {
    const ans = answers[String(i)];

    if (q.type === 'short_answer') {
      saCount++;
      // Short answers are not scored — show model answer only
      return {
        correct:           false,
        answer:            ans ?? null,
        skill:             q.skill ?? null,
        topic:             q.topic ?? null,
        question_type:     'short_answer',
        short_answer_text: ans ?? '',
      };
    }

    const pts = q.points || 1;
    maxScore += pts;

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
      answer:         ans ?? null,
      skill:          q.skill ?? null,
      topic:          q.topic ?? null,
      question_type:  q.type || 'mcq',
      correct_index:  q.type === 'mcq' ? q.options?.findIndex(o => o.is_correct) : undefined,
      correct_answer: q.type === 'true_false' ? q.correct_answer : undefined,
    };
  });

  return { score, maxScore, results, saCount };
}

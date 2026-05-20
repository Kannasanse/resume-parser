import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

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
        gradingMethod: sa.gradingMethod || session.grading_method || 'per_question',
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

    // Calculate combined score (MCQ 60% / SA 40% if mixed, else 100% for whichever)
    const mcqCount = session.questions.filter(q => q.type !== 'short_answer').length;
    if (saCount > 0 && mcqCount > 0) {
      // MCQ score as pct
      const mcqCorrect = results.filter((r, i) => session.questions[i]?.type !== 'short_answer' && r.correct).length;
      const mcqPct = mcqCount > 0 ? (mcqCorrect / mcqCount) * 100 : 0;
      // SA: pending grading — score 0 until graded
      attemptRow.combined_score = Math.round(mcqPct * 0.6);
      attemptRow.combined_pct   = attemptRow.combined_score;
    } else {
      const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
      attemptRow.combined_score = pct;
      attemptRow.combined_pct   = pct;
    }

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
    const pts = q.points || 1;
    maxScore += pts;
    const ans = answers[String(i)];

    if (q.type === 'short_answer') {
      saCount++;
      const saInfo = shortAnswerMap[String(i)] || {};
      return {
        correct:       false,  // pending grading
        answer:        ans ?? null,
        skill:         q.skill ?? null,
        question_type: 'short_answer',
        short_answer_text: ans ?? '',
        grading_method:    saInfo.gradingMethod || 'per_question',
        ai_score:      null,
        ai_feedback:   null,
        self_grade:    null,
        pending_grade: true,
      };
    }

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
      answer:        ans ?? null,
      skill:         q.skill ?? null,
      question_type: q.type || 'mcq',
      correct_index:  q.type === 'mcq' ? q.options?.findIndex(o => o.is_correct) : undefined,
      correct_answer: q.type === 'true_false' ? q.correct_answer : undefined,
    };
  });

  return { score, maxScore, results, saCount };
}

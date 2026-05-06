import supabase from '@/lib/supabase.js';
import { requireUser, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user, profile } = await requireUser(request);
    const { id: attempt_id } = await params;
    const isAdmin = profile.role === 'admin';

    // Fetch attempt
    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('id, test_link_id, submitted_at, score, max_score, auto_submitted')
      .eq('id', attempt_id)
      .single();

    if (!attempt) return Response.json({ error: 'Attempt not found' }, { status: 404 });
    if (!attempt.submitted_at) return Response.json({ error: 'Attempt not yet submitted' }, { status: 400 });

    // Fetch link → verify ownership
    const { data: link } = await supabase
      .from('test_links')
      .select('id, test_id, recipient_email, recipient_name')
      .eq('id', attempt.test_link_id)
      .single();

    if (!link) return Response.json({ error: 'Attempt not found' }, { status: 404 });

    const isOwner = link.recipient_email === profile.email;
    if (!isOwner && !isAdmin) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Fetch test metadata
    const { data: test } = await supabase
      .from('tests')
      .select('id, title, allow_review, job_profiles(title)')
      .eq('id', link.test_id)
      .single();

    if (!test) return Response.json({ error: 'Test not found' }, { status: 404 });

    if (!isAdmin && !test.allow_review) {
      return Response.json({ error: 'Review is not available for this test.' }, { status: 403 });
    }

    // Fetch questions with options (ordered)
    const { data: questions } = await supabase
      .from('test_questions')
      .select('id, type, question_text, position, points, expected_answer, test_options(id, option_text, is_correct, position)')
      .eq('test_id', link.test_id)
      .order('position', { ascending: true });

    // Sort options within each question
    const sortedQuestions = (questions || []).map(q => ({
      ...q,
      test_options: (q.test_options || []).sort((a, b) => a.position - b.position),
    }));

    // Fetch responses
    const { data: responses } = await supabase
      .from('test_responses')
      .select('question_id, selected_option_id, text_response, is_correct, points_awarded, correct_answer_snapshot')
      .eq('attempt_id', attempt_id);

    const responseMap = {};
    for (const r of responses || []) responseMap[r.question_id] = r;

    // Build review data per question
    const pendingShortAnswer = [];
    const reviewQuestions = sortedQuestions.map(q => {
      const r = responseMap[q.id] || null;
      const base = {
        id: q.id,
        type: q.type,
        question_text: q.question_text,
        position: q.position,
        points: q.points,
      };

      if (q.type === 'mcq' || q.type === 'true_false') {
        const correctSnapshot = r?.correct_answer_snapshot || null;
        const options = q.test_options.map(opt => {
          const wasCorrect = correctSnapshot
            ? opt.option_text === correctSnapshot
            : opt.is_correct;
          return {
            id: opt.id,
            option_text: opt.option_text,
            position: opt.position,
            was_correct: wasCorrect,
            was_selected: r?.selected_option_id === opt.id,
          };
        });
        return {
          ...base,
          options,
          is_correct: r?.is_correct ?? null,
          points_awarded: r?.points_awarded ?? 0,
          answered: !!r?.selected_option_id,
        };
      }

      if (q.type === 'short_answer') {
        const isPending = r?.is_correct === null;
        if (isPending) pendingShortAnswer.push(q.id);
        return {
          ...base,
          text_response: r?.text_response || null,
          expected_answer: q.expected_answer || null,
          is_correct: r?.is_correct ?? null,
          points_awarded: r?.points_awarded ?? 0,
          answered: !!r?.text_response,
        };
      }

      return base;
    });

    await auditLog({
      performedBy: user.id,
      action: 'test_review.viewed',
      details: {
        attempt_id,
        test_id: link.test_id,
        test_type: 'admin_assigned',
        viewed_by_admin: isAdmin,
      },
    });

    return Response.json({
      attempt: {
        id: attempt.id,
        submitted_at: attempt.submitted_at,
        score: attempt.score,
        max_score: attempt.max_score,
        auto_submitted: attempt.auto_submitted,
      },
      test: {
        id: test.id,
        title: test.title,
        job_profile: test.job_profiles?.title || null,
        allow_review: test.allow_review,
      },
      link: {
        recipient_name: link.recipient_name,
        recipient_email: link.recipient_email,
      },
      questions: reviewQuestions,
      pending_short_answer_count: pendingShortAnswer.length,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

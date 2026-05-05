import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await requireAdmin(request);
    const { id: test_id, aid } = await params;

    // Verify attempt belongs to a link of this test
    const { data: attempt, error: aErr } = await supabase
      .from('test_attempts')
      .select(`
        id, test_link_id, started_at, submitted_at, auto_submitted,
        score, max_score, graded_at, graded_by, time_remaining_seconds,
        test_links(id, recipient_email, recipient_name, token, test_id)
      `)
      .eq('id', aid)
      .single();

    if (aErr || !attempt) return Response.json({ error: 'Attempt not found' }, { status: 404 });
    if (attempt.test_links?.test_id !== test_id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    // Load responses with question + option data
    const { data: responses } = await supabase
      .from('test_responses')
      .select(`
        id, question_id, selected_option_id, text_response, is_correct, points_awarded,
        test_questions(id, type, question_text, points, position,
          test_options(id, option_text, is_correct, position)
        )
      `)
      .eq('attempt_id', aid);

    // Sort responses by question position
    const sorted = (responses || []).sort(
      (a, b) => (a.test_questions?.position ?? 0) - (b.test_questions?.position ?? 0)
    );

    // Load integrity events
    const { data: events } = await supabase
      .from('test_integrity_events')
      .select('id, event_type, occurred_at')
      .eq('attempt_id', aid)
      .order('occurred_at', { ascending: true });

    // Build integrity summary
    const integrityMap = {};
    for (const e of events || []) {
      integrityMap[e.event_type] = (integrityMap[e.event_type] || 0) + 1;
    }

    return Response.json({
      attempt: {
        ...attempt,
        responses: sorted,
        integrity_events: events || [],
        integrity_summary: integrityMap,
      },
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH — save manual grades (supports overriding auto-graded questions too)
export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAdmin(request);
    const { id: test_id, aid } = await params;
    const { grades } = await request.json();
    // grades: [{ response_id, is_correct, points_awarded }]

    if (!Array.isArray(grades) || !grades.length) {
      return Response.json({ error: 'grades array is required' }, { status: 400 });
    }

    // Verify attempt belongs to this test
    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('id, test_links(test_id), submitted_at')
      .eq('id', aid)
      .single();

    if (!attempt) return Response.json({ error: 'Attempt not found' }, { status: 404 });
    if (attempt.test_links?.test_id !== test_id) return Response.json({ error: 'Forbidden' }, { status: 403 });
    if (!attempt.submitted_at) return Response.json({ error: 'Cannot grade an unsubmitted attempt' }, { status: 409 });

    // Apply each grade override
    await Promise.all(
      grades.map(({ response_id, is_correct, points_awarded }) =>
        supabase
          .from('test_responses')
          .update({
            is_correct: is_correct ?? null,
            points_awarded: Math.max(0, parseFloat(points_awarded) || 0),
          })
          .eq('id', response_id)
          .eq('attempt_id', aid)
      )
    );

    // Recalculate total score
    const { data: allResponses } = await supabase
      .from('test_responses')
      .select('points_awarded')
      .eq('attempt_id', aid);

    const newScore = (allResponses || []).reduce((s, r) => s + (parseFloat(r.points_awarded) || 0), 0);

    await supabase
      .from('test_attempts')
      .update({
        score: newScore,
        graded_at: new Date().toISOString(),
        graded_by: user.id,
      })
      .eq('id', aid);

    await auditLog({
      performedBy: user.id,
      action: 'test.attempt.graded',
      details: { attempt_id: aid, test_id, score: newScore, overrides: grades.length },
    });

    return Response.json({ message: 'Grades saved', score: newScore });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

// GET — fetch test content for a token (strips correct answers)
export async function GET(request, { params }) {
  try {
    const { token } = await params;

    const { data: link, error: lErr } = await supabase
      .from('test_links')
      .select('id, test_id, recipient_email, recipient_name, status, expires_at')
      .eq('token', token)
      .single();

    if (lErr || !link) return Response.json({ error: 'Invalid or expired test link' }, { status: 404 });

    if (link.status === 'revoked') return Response.json({ error: 'REVOKED' }, { status: 403 });
    if (link.status === 'completed') return Response.json({ error: 'COMPLETED' }, { status: 409 });
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      await supabase.from('test_links').update({ status: 'expired' }).eq('id', link.id);
      return Response.json({ error: 'EXPIRED' }, { status: 410 });
    }

    const { data: test } = await supabase
      .from('tests')
      .select(`
        id, title, description, timer_enabled, time_limit_minutes, allow_copy_paste,
        test_questions(
          id, type, question_text, position, points,
          test_options(id, option_text, position)
        )
      `)
      .eq('id', link.test_id)
      .single();

    if (!test) return Response.json({ error: 'Test not found' }, { status: 404 });

    // Sort and strip is_correct from options
    if (test.test_questions) {
      test.test_questions.sort((a, b) => a.position - b.position);
      test.test_questions.forEach(q => {
        if (q.test_options) {
          q.test_options = q.test_options
            .sort((a, b) => a.position - b.position)
            .map(({ id, option_text, position }) => ({ id, option_text, position }));
        }
      });
    }

    // Check for existing in-progress attempt
    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('id, started_at, time_remaining_seconds')
      .eq('test_link_id', link.id)
      .is('submitted_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .single();

    // Load saved responses if resuming
    let savedResponses = {};
    if (attempt) {
      const { data: responses } = await supabase
        .from('test_responses')
        .select('question_id, selected_option_id, text_response')
        .eq('attempt_id', attempt.id);
      for (const r of responses || []) {
        savedResponses[r.question_id] = {
          selected_option_id: r.selected_option_id,
          text_response: r.text_response,
        };
      }
    }

    return Response.json({
      test,
      link: {
        id: link.id,
        recipient_email: link.recipient_email,
        recipient_name: link.recipient_name,
      },
      attempt: attempt ? {
        id: attempt.id,
        started_at: attempt.started_at,
        time_remaining_seconds: attempt.time_remaining_seconds,
      } : null,
      saved_responses: savedResponses,
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// POST — start attempt or submit test
export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { action } = body;

    const { data: link } = await supabase
      .from('test_links')
      .select('id, test_id, status, expires_at')
      .eq('token', token)
      .single();

    if (!link) return Response.json({ error: 'Invalid test link' }, { status: 404 });
    if (link.status === 'revoked') return Response.json({ error: 'REVOKED' }, { status: 403 });
    if (link.status === 'completed') return Response.json({ error: 'COMPLETED' }, { status: 409 });
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return Response.json({ error: 'EXPIRED' }, { status: 410 });
    }

    if (action === 'start') {
      // Check for existing in-progress attempt
      const { data: existing } = await supabase
        .from('test_attempts')
        .select('id, started_at, time_remaining_seconds')
        .eq('test_link_id', link.id)
        .is('submitted_at', null)
        .limit(1)
        .single();

      if (existing) return Response.json({ attempt_id: existing.id });

      // Create new attempt
      const { data: test } = await supabase
        .from('tests')
        .select('timer_enabled, time_limit_minutes')
        .eq('id', link.test_id)
        .single();

      const { data: attempt, error: aErr } = await supabase
        .from('test_attempts')
        .insert({
          test_link_id: link.id,
          time_remaining_seconds: test.timer_enabled ? test.time_limit_minutes * 60 : null,
        })
        .select()
        .single();
      if (aErr) throw aErr;

      // Mark link as in_progress
      await supabase.from('test_links').update({ status: 'in_progress' }).eq('id', link.id);

      return Response.json({ attempt_id: attempt.id }, { status: 201 });
    }

    if (action === 'submit') {
      const { attempt_id, responses = [], time_remaining_seconds, auto_submitted = false } = body;

      const { data: attempt } = await supabase
        .from('test_attempts')
        .select('id, submitted_at')
        .eq('id', attempt_id)
        .eq('test_link_id', link.id)
        .single();

      if (!attempt) return Response.json({ error: 'Attempt not found' }, { status: 404 });
      if (attempt.submitted_at) return Response.json({ error: 'Already submitted' }, { status: 409 });

      // Load questions with correct answers for auto-grading
      const { data: questions } = await supabase
        .from('test_questions')
        .select('id, type, points, test_options(id, is_correct)')
        .eq('test_id', link.test_id);

      const qMap = {};
      for (const q of questions || []) qMap[q.id] = q;

      // Upsert responses + auto-grade mcq/true_false
      let totalScore = 0;
      let maxScore = 0;
      const responseRows = [];

      for (const r of responses) {
        const q = qMap[r.question_id];
        if (!q) continue;
        maxScore += q.points;

        let is_correct = null;
        let points_awarded = 0;

        if (q.type === 'mcq' || q.type === 'true_false') {
          if (r.selected_option_id) {
            const correctOpt = q.test_options.find(o => o.is_correct);
            is_correct = correctOpt?.id === r.selected_option_id;
            if (is_correct) {
              points_awarded = q.points;
              totalScore += q.points;
            }
          }
        }

        responseRows.push({
          attempt_id,
          question_id: r.question_id,
          selected_option_id: r.selected_option_id || null,
          text_response: r.text_response || null,
          is_correct,
          points_awarded,
        });
      }

      // Upsert all responses
      if (responseRows.length) {
        await supabase.from('test_responses').upsert(responseRows, { onConflict: 'attempt_id,question_id' });
      }

      // Count short answer questions — they need manual grading
      const hasShortAnswer = (questions || []).some(q => q.type === 'short_answer');

      await supabase.from('test_attempts').update({
        submitted_at: new Date().toISOString(),
        time_remaining_seconds: time_remaining_seconds ?? null,
        auto_submitted: !!auto_submitted,
        score: hasShortAnswer ? null : totalScore,
        max_score: maxScore,
      }).eq('id', attempt_id);

      await supabase.from('test_links').update({ status: 'completed' }).eq('id', link.id);

      return Response.json({ message: 'Test submitted', score: hasShortAnswer ? null : totalScore, max_score: maxScore });
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

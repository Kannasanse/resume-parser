import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

// POST — auto-save current responses + update time remaining
export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const { attempt_id, responses = [], time_remaining_seconds } = await request.json();

    // Verify token → link → attempt chain
    const { data: link } = await supabase
      .from('test_links')
      .select('id')
      .eq('token', token)
      .single();
    if (!link) return Response.json({ error: 'Invalid token' }, { status: 404 });

    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('id, submitted_at')
      .eq('id', attempt_id)
      .eq('test_link_id', link.id)
      .single();
    if (!attempt) return Response.json({ error: 'Attempt not found' }, { status: 404 });
    if (attempt.submitted_at) return Response.json({ error: 'Already submitted' }, { status: 409 });

    // Upsert responses (no grading yet)
    if (responses.length) {
      const rows = responses.map(r => ({
        attempt_id,
        question_id: r.question_id,
        selected_option_id: r.selected_option_id || null,
        text_response: r.text_response || null,
        is_correct: null,
        points_awarded: 0,
      }));
      await supabase.from('test_responses').upsert(rows, { onConflict: 'attempt_id,question_id' });
    }

    // Update time remaining
    if (time_remaining_seconds !== undefined) {
      await supabase.from('test_attempts')
        .update({ time_remaining_seconds })
        .eq('id', attempt_id);
    }

    return Response.json({ message: 'Saved' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

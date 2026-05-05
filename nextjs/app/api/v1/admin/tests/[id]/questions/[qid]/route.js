import supabase from '@/lib/supabase.js';
import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function PATCH(request, { params }) {
  try {
    await requireAdmin(request);
    const { id: test_id, qid } = await params;
    const body = await request.json();

    // Verify question belongs to this test
    const { data: existing } = await supabase
      .from('test_questions')
      .select('id, type')
      .eq('id', qid)
      .eq('test_id', test_id)
      .single();
    if (!existing) return Response.json({ error: 'Question not found' }, { status: 404 });

    const updates = { updated_at: new Date().toISOString() };
    if ('question_text' in body) updates.question_text = body.question_text?.trim();
    if ('points' in body) updates.points = parseInt(body.points) || 1;

    const { data: question, error: qErr } = await supabase
      .from('test_questions')
      .update(updates)
      .eq('id', qid)
      .select()
      .single();
    if (qErr) throw qErr;

    // Replace options if provided
    if ('options' in body && existing.type === 'mcq') {
      await supabase.from('test_options').delete().eq('question_id', qid);
      const rows = (body.options || []).map((o, i) => ({
        question_id: qid,
        option_text: o.option_text?.trim() || '',
        is_correct: !!o.is_correct,
        position: i,
      })).filter(o => o.option_text);
      if (rows.length) await supabase.from('test_options').insert(rows);
    }

    if ('correct_answer' in body && existing.type === 'true_false') {
      const correctAnswer = body.correct_answer; // 'true' or 'false'
      await supabase.from('test_options').delete().eq('question_id', qid);
      await supabase.from('test_options').insert([
        { question_id: qid, option_text: 'True',  is_correct: correctAnswer === 'true',  position: 0 },
        { question_id: qid, option_text: 'False', is_correct: correctAnswer === 'false', position: 1 },
      ]);
    }

    const { data: opts } = await supabase
      .from('test_options')
      .select('id, option_text, is_correct, position')
      .eq('question_id', qid)
      .order('position', { ascending: true });

    return Response.json({ question: { ...question, test_options: opts || [] } });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await requireAdmin(request);
    const { id: test_id, qid } = await params;

    const { data: existing } = await supabase
      .from('test_questions')
      .select('id')
      .eq('id', qid)
      .eq('test_id', test_id)
      .single();
    if (!existing) return Response.json({ error: 'Question not found' }, { status: 404 });

    await supabase.from('test_questions').delete().eq('id', qid);

    return Response.json({ message: 'Question deleted' });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

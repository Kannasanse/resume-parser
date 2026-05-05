import supabase from '@/lib/supabase.js';
import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const { data, error } = await supabase
      .from('test_questions')
      .select('id, type, question_text, position, points, test_options(id, option_text, is_correct, position)')
      .eq('test_id', id)
      .order('position', { ascending: true });

    if (error) throw error;

    const questions = (data || []).map(q => ({
      ...q,
      test_options: (q.test_options || []).sort((a, b) => a.position - b.position),
    }));

    return Response.json({ questions });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    await requireAdmin(request);
    const { id: test_id } = await params;
    const body = await request.json();
    const { type, question_text, points = 1, options = [] } = body;

    if (!type || !['mcq', 'true_false', 'short_answer'].includes(type)) {
      return Response.json({ error: 'type must be mcq, true_false, or short_answer' }, { status: 400 });
    }
    if (!question_text?.trim()) {
      return Response.json({ error: 'question_text is required' }, { status: 400 });
    }

    // Check test exists and is not archived
    const { data: test } = await supabase.from('tests').select('status').eq('id', test_id).single();
    if (!test) return Response.json({ error: 'Test not found' }, { status: 404 });
    if (test.status === 'archived') return Response.json({ error: 'Cannot add questions to an archived test' }, { status: 409 });

    // Get next position
    const { data: last } = await supabase
      .from('test_questions')
      .select('position')
      .eq('test_id', test_id)
      .order('position', { ascending: false })
      .limit(1)
      .single();
    const position = last ? last.position + 1 : 0;

    const { data: question, error: qErr } = await supabase
      .from('test_questions')
      .insert({ test_id, type, question_text: question_text.trim(), position, points: parseInt(points) || 1 })
      .select()
      .single();
    if (qErr) throw qErr;

    // Insert options for mcq and true_false
    let savedOptions = [];
    if (type === 'mcq' && options.length) {
      const rows = options.map((o, i) => ({
        question_id: question.id,
        option_text: o.option_text?.trim() || '',
        is_correct: !!o.is_correct,
        position: i,
      })).filter(o => o.option_text);
      if (rows.length) {
        const { data: opts, error: oErr } = await supabase.from('test_options').insert(rows).select();
        if (oErr) throw oErr;
        savedOptions = opts || [];
      }
    } else if (type === 'true_false') {
      const correctAnswer = body.correct_answer; // 'true' or 'false'
      const rows = [
        { question_id: question.id, option_text: 'True',  is_correct: correctAnswer === 'true',  position: 0 },
        { question_id: question.id, option_text: 'False', is_correct: correctAnswer === 'false', position: 1 },
      ];
      const { data: opts, error: oErr } = await supabase.from('test_options').insert(rows).select();
      if (oErr) throw oErr;
      savedOptions = opts || [];
    }

    return Response.json({ question: { ...question, test_options: savedOptions } }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

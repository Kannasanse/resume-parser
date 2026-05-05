import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { user } = await requireAdmin(request);
    const { id: test_id } = await params;
    const { question_ids } = await request.json();

    if (!Array.isArray(question_ids) || !question_ids.length) {
      return Response.json({ error: 'question_ids array is required' }, { status: 400 });
    }

    // Verify test exists
    const { data: test } = await supabase.from('tests').select('id').eq('id', test_id).single();
    if (!test) return Response.json({ error: 'Test not found' }, { status: 404 });

    // Get current max position in this test
    const { data: existing } = await supabase
      .from('test_questions')
      .select('id, library_question_id, position')
      .eq('test_id', test_id);

    const alreadyAdded = new Set((existing || []).map(q => q.library_question_id).filter(Boolean));
    const duplicates   = question_ids.filter(id => alreadyAdded.has(id));
    const toAdd        = question_ids.filter(id => !alreadyAdded.has(id));

    if (!toAdd.length) {
      return Response.json({
        error: 'All selected questions are already in this test.',
        duplicates,
      }, { status: 409 });
    }

    const maxPos = Math.max(-1, ...(existing || []).map(q => q.position ?? 0));

    // Fetch library questions with options
    const { data: libQs, error: lErr } = await supabase
      .from('question_library')
      .select('*, question_library_options(id, option_text, is_correct, position)')
      .in('id', toAdd);
    if (lErr) throw lErr;

    const added = [];
    let pos = maxPos + 1;

    for (const lq of libQs || []) {
      const { data: tq, error: tqErr } = await supabase
        .from('test_questions')
        .insert({
          test_id,
          type: lq.type,
          question_text: lq.question_text,
          points: lq.points,
          position: pos++,
          library_question_id: lq.id,
        })
        .select()
        .single();
      if (tqErr) throw tqErr;

      const opts = (lq.question_library_options || []).sort((a, b) => a.position - b.position);
      if (opts.length) {
        const { data: topts } = await supabase
          .from('test_options')
          .insert(opts.map(o => ({ question_id: tq.id, option_text: o.option_text, is_correct: o.is_correct, position: o.position })))
          .select();
        tq.test_options = topts || [];
      } else {
        tq.test_options = [];
      }

      added.push(tq);
    }

    await auditLog({
      performedBy: user.id,
      action: 'test.questions.from_library',
      details: { test_id, added: added.length, duplicates_skipped: duplicates.length },
    });

    return Response.json({ added, duplicates_skipped: duplicates.length }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

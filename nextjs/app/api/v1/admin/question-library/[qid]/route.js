import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await requireAdmin(request);
    const { qid } = await params;

    const { data: q, error } = await supabase
      .from('question_library')
      .select('*, question_library_options(id, option_text, is_correct, position)')
      .eq('id', qid)
      .single();

    if (error || !q) return Response.json({ error: 'Question not found' }, { status: 404 });

    q.question_library_options?.sort((a, b) => a.position - b.position);

    // Tests this question is used in
    const { data: usages } = await supabase
      .from('test_questions')
      .select('test_id, tests(id, title, status)')
      .eq('library_question_id', qid);

    return Response.json({ question: q, usages: usages || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAdmin(request);
    const { qid } = await params;
    const body = await request.json();

    const { data: existing } = await supabase.from('question_library').select('id').eq('id', qid).single();
    if (!existing) return Response.json({ error: 'Question not found' }, { status: 404 });

    const { type, question_text, points, skill_tag, topic, options = [], correct_answer } = body;

    // Check impact on published tests
    const { data: usages } = await supabase
      .from('test_questions')
      .select('test_id, tests(status)')
      .eq('library_question_id', qid);

    const publishedCount = (usages || []).filter(u => u.tests?.status === 'published').length;

    const updates = { updated_at: new Date().toISOString() };
    if (question_text !== undefined) updates.question_text = question_text.trim();
    if (points       !== undefined) updates.points = parseInt(points) || 1;
    if (skill_tag    !== undefined) updates.skill_tag = skill_tag?.trim() || null;
    if (topic        !== undefined) updates.topic = topic?.trim() || null;

    const { data: updated, error } = await supabase
      .from('question_library')
      .update(updates)
      .eq('id', qid)
      .select()
      .single();
    if (error) throw error;

    // Replace options
    if (options.length || correct_answer !== undefined) {
      await supabase.from('question_library_options').delete().eq('question_id', qid);

      let optRows = [];
      const qType = type || updated.type;
      if (qType === 'mcq' && options.length) {
        optRows = options.map((o, i) => ({ question_id: qid, option_text: o.option_text, is_correct: !!o.is_correct, position: i }));
      } else if (qType === 'true_false') {
        const correctVal = correct_answer === 'false' ? 'False' : 'True';
        optRows = [
          { question_id: qid, option_text: 'True',  is_correct: correctVal === 'True',  position: 0 },
          { question_id: qid, option_text: 'False', is_correct: correctVal === 'False', position: 1 },
        ];
      }
      if (optRows.length) await supabase.from('question_library_options').insert(optRows);
    }

    // Propagate to all test_questions that reference this library question
    if (updates.question_text !== undefined || updates.points !== undefined) {
      const propagate = {};
      if (updates.question_text) propagate.question_text = updates.question_text;
      if (updates.points)        propagate.points = updates.points;
      await supabase.from('test_questions').update(propagate).eq('library_question_id', qid);
    }

    await auditLog({ performedBy: user.id, action: 'question_library.update', details: { question_id: qid, published_tests_affected: publishedCount } });

    return Response.json({ question: updated, published_tests_affected: publishedCount });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAdmin(request);
    const { qid } = await params;
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Check if used in published tests
    const { data: usages } = await supabase
      .from('test_questions')
      .select('test_id, tests(title, status)')
      .eq('library_question_id', qid);

    const publishedUsages = (usages || []).filter(u => u.tests?.status === 'published');

    if (publishedUsages.length && !force) {
      return Response.json({
        error: 'USED_IN_PUBLISHED',
        message: `This question is used in ${publishedUsages.length} published test${publishedUsages.length !== 1 ? 's' : ''}. Deleting it will remove it from those tests.`,
        count: publishedUsages.length,
        tests: publishedUsages.map(u => u.tests?.title),
      }, { status: 409 });
    }

    const { error } = await supabase.from('question_library').delete().eq('id', qid);
    if (error) throw error;

    await auditLog({ performedBy: user.id, action: 'question_library.delete', details: { question_id: qid, force, usages: (usages || []).length } });

    return Response.json({ message: 'Question deleted' });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const search      = searchParams.get('search') || '';
    const type        = searchParams.get('type') || '';
    const skill_tag   = searchParams.get('skill_tag') || '';
    const ai_generated = searchParams.get('ai_generated') || '';
    const difficulty  = searchParams.get('difficulty') || '';
    const page        = parseInt(searchParams.get('page') || '1');
    const limit       = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset      = (page - 1) * limit;

    let query = supabase
      .from('question_library')
      .select('id, type, question_text, points, skill_tag, topic, ai_generated, difficulty, created_at, question_library_options(id, option_text, is_correct, position)', { count: 'exact' });

    if (search) query = query.ilike('question_text', `%${search}%`);
    if (type)   query = query.eq('type', type);
    if (skill_tag) query = query.eq('skill_tag', skill_tag);
    if (ai_generated === 'true')  query = query.eq('ai_generated', true);
    if (ai_generated === 'false') query = query.eq('ai_generated', false);
    if (difficulty) query = query.eq('difficulty', difficulty);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Sort options by position
    const questions = (data || []).map(q => ({
      ...q,
      question_library_options: (q.question_library_options || []).sort((a, b) => a.position - b.position),
    }));

    // Distinct skill tags and topics for filters
    const [{ data: skillRows }, { data: topicRows }] = await Promise.all([
      supabase.from('question_library').select('skill_tag').not('skill_tag', 'is', null).neq('skill_tag', ''),
      supabase.from('question_library').select('topic').not('topic', 'is', null).neq('topic', ''),
    ]);
    const skillTags = [...new Set((skillRows || []).map(r => r.skill_tag))].sort();
    const topics    = [...new Set((topicRows  || []).map(r => r.topic))].sort();

    return Response.json({ questions, total: count || 0, page, limit, skillTags, topics });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user } = await requireAdmin(request);
    const body = await request.json();

    // Bulk save (from AI review screen)
    if (Array.isArray(body.questions)) {
      const saved = [];
      for (const q of body.questions) {
        const inserted = await insertOne(q, user.id);
        saved.push(inserted);
      }
      await auditLog({ performedBy: user.id, action: 'question_library.bulk_create', details: { count: saved.length } });
      return Response.json({ questions: saved }, { status: 201 });
    }

    // Single save
    const q = await insertOne(body, user.id);
    await auditLog({ performedBy: user.id, action: 'question_library.create', details: { question_id: q.id } });
    return Response.json({ question: q }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

async function insertOne(body, userId) {
  const { type, question_text, points, skill_tag, topic, options = [], correct_answer, ai_generated = false, difficulty = null } = body;

  if (!type || !question_text?.trim()) throw new Error('type and question_text are required');
  if (!['mcq', 'true_false', 'short_answer'].includes(type)) throw new Error('Invalid type');

  const { data: q, error } = await supabase
    .from('question_library')
    .insert({
      type,
      question_text: question_text.trim(),
      points: parseInt(points) || 1,
      skill_tag: skill_tag?.trim() || null,
      topic: topic?.trim() || null,
      ai_generated: !!ai_generated,
      difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : null,
      created_by: userId,
    })
    .select()
    .single();
  if (error) throw error;

  // Insert options
  let optRows = [];
  if (type === 'mcq' && options.length) {
    optRows = options.map((o, i) => ({ question_id: q.id, option_text: o.option_text, is_correct: !!o.is_correct, position: i }));
  } else if (type === 'true_false') {
    const correctVal = correct_answer === 'false' ? 'False' : 'True';
    optRows = [
      { question_id: q.id, option_text: 'True',  is_correct: correctVal === 'True',  position: 0 },
      { question_id: q.id, option_text: 'False', is_correct: correctVal === 'False', position: 1 },
    ];
  }
  if (optRows.length) {
    const { error: oErr } = await supabase.from('question_library_options').insert(optRows);
    if (oErr) throw oErr;
  }

  return { ...q, question_library_options: optRows };
}

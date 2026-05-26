import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const search       = searchParams.get('search') || '';
    const type         = searchParams.get('type') || '';
    const source       = searchParams.get('source') || '';      // 'manual'|'ai'|'skill'|'jd'
    const skill_tag    = searchParams.get('skill_tag') || '';
    const topic        = searchParams.get('topic') || '';
    const difficulty   = searchParams.get('difficulty') || '';
    const needs_review = searchParams.get('needs_review') === 'true';
    const suppressed   = searchParams.get('suppressed') === 'true';
    const sortField    = ['created_at', 'difficulty', 'times_used', 'quality_score'].includes(searchParams.get('sort'))
                           ? searchParams.get('sort') : 'created_at';
    const sortAsc      = (searchParams.get('order') || 'desc') === 'asc';
    const page         = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit        = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20')), 200);
    const offset       = (page - 1) * limit;

    const extendedSel = 'id, type, question_text, points, skill_tag, topic, ai_generated, difficulty, created_at, source, generated_for, times_used, times_correct, times_incorrect, quality_score, is_approved, question_library_options(id, option_text, is_correct, position)';
    const baseSel     = 'id, type, question_text, points, skill_tag, topic, ai_generated, difficulty, created_at, question_library_options(id, option_text, is_correct, position)';

    // Apply filters that exist on base schema (no new columns required)
    const applyBaseFilters = (q) => {
      if (search)    q = q.ilike('question_text', `%${search}%`);
      if (type)      q = q.eq('type', type);
      if (skill_tag) q = q.eq('skill_tag', skill_tag);
      if (difficulty) q = q.eq('difficulty', difficulty);

      // Source mapping
      if (source === 'manual') {
        q = q.eq('ai_generated', false);
      } else if (source === 'skill') {
        q = q.eq('generated_for', 'skills');
      } else if (source === 'jd') {
        q = q.eq('generated_for', 'jd');
      }
      // 'ai' source is applied separately below due to complex OR condition

      return q;
    };

    // Apply filters that require new columns (topic, needs_review, suppressed, 'ai' source)
    const applyExtendedFilters = (q) => {
      if (topic) q = q.eq('topic', topic);
      if (needs_review) q = q.gte('times_used', 10).lt('quality_score', 0.40);
      if (suppressed) q = q.eq('is_approved', false);
      return q;
    };

    let data, error, count;

    // Build primary query with extended select
    let q = applyBaseFilters(
      supabase.from('question_library').select(extendedSel, { count: 'exact' })
    );
    q = applyExtendedFilters(q);

    // 'ai' source: ai_generated=true AND generated_for NOT IN ('skills','jd')
    if (source === 'ai') {
      try {
        q = q.eq('ai_generated', true).not('generated_for', 'in', '(skills,jd)');
      } catch {
        q = q.eq('ai_generated', true);
      }
    }

    ({ data, error, count } = await q
      .order(sortField, { ascending: sortAsc })
      .range(offset, offset + limit - 1));

    if (error) {
      // Extended columns not yet migrated — fall back gracefully
      if (needs_review || suppressed) {
        // Cannot apply these filters without new columns
        return Response.json({ questions: [], total: 0, page, pages: 0, limit, facets: { skills: [], topics: [] } });
      }

      let fallback = applyBaseFilters(
        supabase.from('question_library').select(baseSel, { count: 'exact' })
      );
      if (source === 'ai') fallback = fallback.eq('ai_generated', true);

      // Sort by created_at only on fallback (other sort fields may not exist)
      const fallbackSort = sortField === 'created_at' ? sortField : 'created_at';
      ({ data, error, count } = await fallback
        .order(fallbackSort, { ascending: sortAsc })
        .range(offset, offset + limit - 1));
    }

    if (error) throw error;

    const questions = (data || []).map(row => ({
      ...row,
      question_library_options: (row.question_library_options || [])
        .sort((a, b) => a.position - b.position),
    }));

    // Facets — run in parallel, fail gracefully
    const [skillRes, topicRes, filteredTopicRes] = await Promise.all([
      supabase.from('question_library').select('skill_tag').not('skill_tag', 'is', null).neq('skill_tag', ''),
      !skill_tag
        ? supabase.from('question_library').select('topic').not('topic', 'is', null).neq('topic', '')
        : Promise.resolve({ data: null }),
      skill_tag
        ? supabase.from('question_library').select('topic').eq('skill_tag', skill_tag).not('topic', 'is', null).neq('topic', '')
        : Promise.resolve({ data: null }),
    ]);

    const skills = [...new Set((skillRes.data || []).map(r => r.skill_tag))].sort();
    const topicSource = skill_tag ? (filteredTopicRes.data || []) : (topicRes.data || []);
    const topics = [...new Set(topicSource.map(r => r.topic))].sort();

    return Response.json({
      questions,
      total: count || 0,
      page,
      pages: Math.ceil((count || 0) / limit),
      limit,
      facets: { skills, topics },
    });
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

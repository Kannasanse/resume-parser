import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

const VALID_TYPES = ['mcq', 'true_false', 'short_answer'];
const VALID_DIFFICULTIES = ['easy', 'medium', 'hard'];
const MAX_QUESTIONS = 200;

/**
 * Validate a single incoming question row.
 * Returns null if valid, or an error string if invalid.
 */
function validateQuestion(q, index) {
  if (!q || typeof q !== 'object') return `[${index}] must be an object`;
  if (!q.question_text?.trim()) return `[${index}] question_text is required`;
  if (!VALID_TYPES.includes(q.type)) return `[${index}] type must be one of: ${VALID_TYPES.join(', ')}`;
  if (q.type === 'mcq') {
    if (!Array.isArray(q.options) || q.options.length < 2) {
      return `[${index}] mcq questions require at least 2 options`;
    }
    if (!q.options.some(o => o.is_correct)) {
      return `[${index}] mcq questions require at least one correct option`;
    }
  }
  return null;
}

/**
 * Insert a single validated question (mirrors insertOne in route.js).
 */
async function insertOne(body, userId) {
  const {
    type,
    question_text,
    points,
    skill_tag,
    topic,
    options = [],
    correct_answer,
    difficulty = null,
    ai_generated = false,
  } = body;

  const { data: q, error } = await supabase
    .from('question_library')
    .insert({
      type,
      question_text: question_text.trim(),
      points: parseInt(points) || 1,
      skill_tag: skill_tag?.trim() || null,
      topic: topic?.trim() || null,
      ai_generated: !!ai_generated,
      difficulty: VALID_DIFFICULTIES.includes(difficulty) ? difficulty : null,
      created_by: userId,
    })
    .select()
    .single();

  if (error) throw error;

  // Build option rows
  let optRows = [];
  if (type === 'mcq' && options.length) {
    optRows = options.map((o, i) => ({
      question_id: q.id,
      option_text: o.option_text,
      is_correct: !!o.is_correct,
      position: i,
    }));
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

export async function POST(request) {
  try {
    const { user } = await requireAdmin(request);

    let body;
    try {
      body = await request.json();
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
    }

    const { questions } = body || {};

    if (!Array.isArray(questions) || questions.length === 0) {
      return Response.json({ error: 'questions must be a non-empty array' }, { status: 400 });
    }
    if (questions.length > MAX_QUESTIONS) {
      return Response.json(
        { error: `Maximum ${MAX_QUESTIONS} questions per import` },
        { status: 400 }
      );
    }

    let imported = 0;
    let skipped = 0;
    const errors = [];

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];

      // Validate
      const validationError = validateQuestion(q, i);
      if (validationError) {
        errors.push(validationError);
        skipped++;
        continue;
      }

      // Insert
      try {
        await insertOne(q, user.id);
        imported++;
      } catch (err) {
        errors.push(`[${i}] ${err.message}`);
        skipped++;
      }
    }

    await auditLog({
      performedBy: user.id,
      action: 'question_library.bulk_import',
      details: { imported, skipped, total: questions.length },
    });

    return Response.json({ imported, skipped, errors }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

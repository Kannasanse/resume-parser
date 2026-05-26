import supabase from '@/lib/supabase.js';

// Maps a question_library row (with joined options) to self_test session question format.
// MCQ options are shuffled to prevent position memorization on reuse.
export function normaliseLibraryQuestion(q) {
  const options = (q.question_library_options || [])
    .sort((a, b) => a.position - b.position)
    .map(o => ({ option_text: o.option_text, is_correct: !!o.is_correct }));

  const out = {
    library_question_id: q.id,
    type:          q.type,
    question_text: q.question_text,
    points:        q.points || 1,
    skill:         q.skill_tag || null,
    topic:         q.topic || null,
    difficulty:    q.difficulty || null,
    explanation:   q.explanation || null,
  };

  if (q.type === 'mcq') {
    out.options = [...options].sort(() => Math.random() - 0.5);
  } else if (q.type === 'true_false') {
    const correct = options.find(o => o.is_correct);
    out.correct_answer = correct
      ? correct.option_text.toLowerCase() === 'true' ? 'true' : 'false'
      : 'true';
  } else if (q.type === 'short_answer') {
    out.model_answer    = q.model_answer || '';
    out.grading_rubric  = q.grading_rubric || '';
    out.answer_keywords = Array.isArray(q.answer_keywords) ? q.answer_keywords : [];
  }

  return out;
}

// Fetch matching questions from the shared library before calling AI.
// Only returns MCQ and True/False — short answers are too context-specific.
// All errors return empty array (non-fatal, AI will fill the gap).
// Two-pass: topic-matched questions first, then fill remainder from same skill/difficulty.
export async function fetchFromLibrary({ skills = [], topics = [], difficulty, questionTypes = [], requestedCount = 0 }) {
  if (!requestedCount || !skills.length) return [];

  const fetchTypes = questionTypes.filter(t => ['mcq', 'true_false'].includes(t));
  if (!fetchTypes.length) return [];

  const normalizedSkills = skills
    .map(s => (typeof s === 'string' ? s.trim() : (s?.name || '').trim()))
    .filter(Boolean);
  if (!normalizedSkills.length) return [];

  const normalizedTopics = (topics || []).map(t => t.trim()).filter(Boolean);

  const sel = 'id, type, question_text, points, skill_tag, topic, difficulty, explanation, model_answer, question_library_options(id, option_text, is_correct, position)';
  const fetchLimit = requestedCount * 4;

  const buildQuery = (filterApproved, topicFilter = null) => {
    let q = supabase.from('question_library').select(sel)
      .in('skill_tag', normalizedSkills)
      .in('type', fetchTypes)
      .limit(fetchLimit);
    if (difficulty) q = q.eq('difficulty', difficulty);
    if (topicFilter?.length) q = q.in('topic', topicFilter);
    if (filterApproved) q = q.eq('is_approved', true);
    return q;
  };

  try {
    const collected = [];
    const usedIds = new Set();

    // Pass 1: topic-matched questions (only if topic hints provided)
    if (normalizedTopics.length) {
      let { data: topicData, error: topicErr } = await buildQuery(true, normalizedTopics);
      if (topicErr) ({ data: topicData } = await buildQuery(false, normalizedTopics));
      if (topicData?.length) {
        const shuffled = [...topicData].sort(() => Math.random() - 0.5);
        for (const row of shuffled) {
          if (collected.length >= requestedCount) break;
          collected.push(normaliseLibraryQuestion(row));
          usedIds.add(row.id);
        }
      }
    }

    // Pass 2: fill remainder with any matching skill/difficulty questions
    if (collected.length < requestedCount) {
      let { data, error } = await buildQuery(true);
      if (error) {
        ({ data, error } = await buildQuery(false));
        if (error) {
          console.error('[Library] fetchFromLibrary error:', error.message);
          return collected;
        }
      }
      if (data?.length) {
        const remaining = [...data].filter(r => !usedIds.has(r.id)).sort(() => Math.random() - 0.5);
        for (const row of remaining) {
          if (collected.length >= requestedCount) break;
          collected.push(normaliseLibraryQuestion(row));
        }
      }
    }

    return collected;
  } catch (err) {
    console.error('[Library] fetchFromLibrary exception:', err.message);
    return [];
  }
}

// Save questions to the shared library after a session is created (fire-and-forget).
// - Library questions (with library_question_id): increment times_used
// - AI-generated questions: insert new row + options
// Only runs for skills/jd modes; content is skipped (questions are content-specific).
export async function saveQuestionsToLibrary(questions, sessionId, userId, inputType) {
  if (!['skills', 'jd'].includes(inputType)) return;

  for (const q of questions) {
    try {
      if (q.library_question_id) {
        // This question was pulled from library — increment usage counter
        const { data: cur } = await supabase
          .from('question_library')
          .select('times_used')
          .eq('id', q.library_question_id)
          .single();
        if (cur) {
          await supabase
            .from('question_library')
            .update({ times_used: (cur.times_used || 0) + 1 })
            .eq('id', q.library_question_id);
        }
        continue;
      }

      // AI-generated question — insert into library
      const row = {
        type:          q.type,
        question_text: q.question_text,
        points:        q.points || 1,
        skill_tag:     q.skill || null,
        topic:         q.topic || null,
        difficulty:    q.difficulty || null,
        ai_generated:  true,
        source:        'ai-generated',
        session_id:    sessionId,
        generated_by:  userId,
        generated_for: inputType,
        times_used:    1,
        is_approved:   true,
        explanation:   q.explanation || null,
      };

      if (q.type === 'short_answer') {
        row.model_answer    = q.model_answer || null;
        row.grading_rubric  = q.grading_rubric || null;
        row.answer_keywords = Array.isArray(q.answer_keywords) && q.answer_keywords.length
          ? q.answer_keywords : null;
      }

      const { data: libQ, error: insertErr } = await supabase
        .from('question_library')
        .insert(row)
        .select('id')
        .single();

      if (insertErr) {
        // New columns may not exist yet — fall back to minimal insert
        const compat = {
          type:         row.type,
          question_text: row.question_text,
          points:       row.points,
          skill_tag:    row.skill_tag,
          difficulty:   row.difficulty,
          ai_generated: true,
        };
        const { data: libQ2, error: e2 } = await supabase
          .from('question_library')
          .insert(compat)
          .select('id')
          .single();
        if (e2 || !libQ2) {
          console.error('[Library] insert failed:', e2?.message || 'no data');
          continue;
        }
        await _insertOptions(libQ2.id, q);
        continue;
      }

      if (libQ) await _insertOptions(libQ.id, q);
    } catch (err) {
      console.error('[Library] saveQuestionsToLibrary error:', err.message);
    }
  }
}

async function _insertOptions(libQId, q) {
  try {
    if (q.type === 'mcq' && Array.isArray(q.options) && q.options.length) {
      await supabase.from('question_library_options').insert(
        q.options.map((o, i) => ({
          question_id: libQId,
          option_text: o.option_text,
          is_correct:  !!o.is_correct,
          position:    i,
        }))
      );
    } else if (q.type === 'true_false') {
      const isTrue = q.correct_answer === 'true';
      await supabase.from('question_library_options').insert([
        { question_id: libQId, option_text: 'True',  is_correct: isTrue,  position: 0 },
        { question_id: libQId, option_text: 'False', is_correct: !isTrue, position: 1 },
      ]);
    }
  } catch (err) {
    console.error('[Library] _insertOptions error:', err.message);
  }
}

// Update times_correct / times_incorrect after a quiz attempt is submitted.
// Only updates MCQ/TF questions that came from the library (have library_question_id).
// Non-fatal — errors are logged and ignored.
export async function updateLibraryQuestionStats(questions, results) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const r = results[i];
    if (!q?.library_question_id || q.type === 'short_answer') continue;

    try {
      const { data: cur } = await supabase
        .from('question_library')
        .select('times_correct, times_incorrect, times_used')
        .eq('id', q.library_question_id)
        .single();

      if (!cur) continue;

      const timesCorrect   = (cur.times_correct   || 0) + (r?.correct ? 1 : 0);
      const timesIncorrect = (cur.times_incorrect  || 0) + (r?.correct ? 0 : 1);
      const answered = timesCorrect + timesIncorrect;

      const updates = { times_correct: timesCorrect, times_incorrect: timesIncorrect };
      if (answered >= 5) {
        updates.quality_score = timesCorrect / answered;
      }

      await supabase
        .from('question_library')
        .update(updates)
        .eq('id', q.library_question_id);
    } catch (err) {
      console.error('[Library] updateLibraryQuestionStats error:', err.message);
    }
  }
}

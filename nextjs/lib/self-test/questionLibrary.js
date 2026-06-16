import supabase from '@/lib/supabase.js';

// Maps a question_library row (with joined options) to self_test session question format.
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
    skill_id:      q.skill_id  || null,
    topic:         q.topic     || null,
    topic_id:      q.topic_id  || null,
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
// Two-pass: topic-matched first, then fill remainder from skill/difficulty.
// Supports both ID-based (preferred) and text-based skill matching.
export async function fetchFromLibrary({
  skills = [],
  skillIds = [],
  topics = [],
  topicIds = [],
  difficulty,
  questionTypes = [],
  requestedCount = 0,
}) {
  if (!requestedCount || (!skills.length && !skillIds.length)) return [];

  const fetchTypes = questionTypes.filter(t => ['mcq', 'true_false'].includes(t));
  if (!fetchTypes.length) return [];

  const normalizedSkills = skills
    .map(s => (typeof s === 'string' ? s.trim() : (s?.name || '').trim()))
    .filter(Boolean);

  const sel = 'id, type, question_text, points, skill_tag, skill_id, topic, topic_id, difficulty, explanation, model_answer, question_library_options(id, option_text, is_correct, position)';
  const fetchLimit = requestedCount * 4;

  const buildQuery = (filterApproved, topicFilter = null, useIds = false) => {
    let q = supabase.from('question_library').select(sel)
      .in('type', fetchTypes).limit(fetchLimit);

    if (useIds && skillIds.length) {
      q = q.in('skill_id', skillIds);
    } else if (normalizedSkills.length) {
      q = q.in('skill_tag', normalizedSkills);
    }

    if (difficulty) q = q.eq('difficulty', difficulty);

    if (topicFilter?.ids?.length) {
      q = q.in('topic_id', topicFilter.ids);
    } else if (topicFilter?.names?.length) {
      q = q.in('topic', topicFilter.names);
    }

    if (filterApproved) q = q.eq('is_approved', true);
    return q;
  };

  const useIds = skillIds.length > 0;

  try {
    const collected = [];
    const usedIds = new Set();

    // Pass 1: topic-matched
    if (topics.length || topicIds.length) {
      const topicFilter = { ids: topicIds, names: topics };
      let { data: topicData, error: topicErr } = await buildQuery(true, topicFilter, useIds);
      if (topicErr) ({ data: topicData } = await buildQuery(false, topicFilter, useIds));
      if (topicData?.length) {
        for (const row of [...topicData].sort(() => Math.random() - 0.5)) {
          if (collected.length >= requestedCount) break;
          collected.push(normaliseLibraryQuestion(row));
          usedIds.add(row.id);
        }
      }
    }

    // Pass 2: fill remainder
    if (collected.length < requestedCount) {
      let { data, error } = await buildQuery(true, null, useIds);
      if (error) {
        ({ data, error } = await buildQuery(false, null, useIds));
        // Last resort: fall back to text-based if ID query failed
        if (error && useIds && normalizedSkills.length) {
          ({ data, error } = await buildQuery(false, null, false));
        }
        if (error) {
          console.error('[Library] fetchFromLibrary error:', error.message);
          return collected;
        }
      }
      if (data?.length) {
        for (const row of [...data].filter(r => !usedIds.has(r.id)).sort(() => Math.random() - 0.5)) {
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

// Save questions to the shared library after session creation (fire-and-forget).
export async function saveQuestionsToLibrary(questions, sessionId, userId, inputType) {
  if (!['skills', 'jd'].includes(inputType)) return;

  for (const q of questions) {
    try {
      if (q.library_question_id) {
        const { data: cur } = await supabase
          .from('question_library').select('times_used')
          .eq('id', q.library_question_id).single();
        if (cur) {
          await supabase.from('question_library')
            .update({ times_used: (cur.times_used || 0) + 1 })
            .eq('id', q.library_question_id);
        }
        continue;
      }

      const row = {
        type:          q.type,
        question_text: q.question_text,
        points:        q.points || 1,
        skill_tag:     q.skill    || null,
        skill_id:      q.skill_id || null,
        topic:         q.topic    || null,
        topic_id:      q.topic_id || null,
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
        .from('question_library').insert(row).select('id').single();

      if (insertErr) {
        const compat = {
          type:          row.type,
          question_text: row.question_text,
          points:        row.points,
          skill_tag:     row.skill_tag,
          difficulty:    row.difficulty,
          ai_generated:  true,
        };
        const { data: libQ2, error: e2 } = await supabase
          .from('question_library').insert(compat).select('id').single();
        if (e2 || !libQ2) { console.error('[Library] insert failed:', e2?.message); continue; }
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
          question_id: libQId, option_text: o.option_text, is_correct: !!o.is_correct, position: i,
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

// Update times_correct / times_incorrect after quiz submission.
export async function updateLibraryQuestionStats(questions, results) {
  for (let i = 0; i < questions.length; i++) {
    const q = questions[i];
    const r = results[i];
    if (!q?.library_question_id || q.type === 'short_answer') continue;

    try {
      const { data: cur } = await supabase
        .from('question_library').select('times_correct, times_incorrect, times_used')
        .eq('id', q.library_question_id).single();
      if (!cur) continue;

      const timesCorrect   = (cur.times_correct   || 0) + (r?.correct ? 1 : 0);
      const timesIncorrect = (cur.times_incorrect  || 0) + (r?.correct ? 0 : 1);
      const answered = timesCorrect + timesIncorrect;
      const updates = { times_correct: timesCorrect, times_incorrect: timesIncorrect };
      if (answered >= 5) updates.quality_score = timesCorrect / answered;

      await supabase.from('question_library').update(updates).eq('id', q.library_question_id);
    } catch (err) {
      console.error('[Library] updateLibraryQuestionStats error:', err.message);
    }
  }
}

import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';
import { callGemini } from '@/lib/gemini';
import { deductCredits, getBalance, CREDIT_COSTS } from '@/lib/credits.js';
import { fetchFromLibrary, saveQuestionsToLibrary } from '@/lib/self-test/questionLibrary.js';
import { METADATA_INSTRUCTION } from '@/lib/self-test/prompts/metadataInstruction.js';
import { resolveSkill } from '@/lib/skills/resolveSkill.js';
import { saveTopicHint, saveAIInferredTopics } from '@/lib/skills/saveTopicHint.js';

export const dynamic = 'force-dynamic';

// ── System prompts ────────────────────────────────────────────────────────────

const MCQ_SHAPE = `{
  "type": "mcq",
  "skill": "React",
  "topic": "Custom Hooks",
  "question_text": "...",
  "points": 1,
  "options": [
    {"option_text": "...", "is_correct": false},
    {"option_text": "...", "is_correct": true},
    {"option_text": "...", "is_correct": false},
    {"option_text": "...", "is_correct": false}
  ],
  "explanation": "2-4 sentences explaining why the correct answer is right and why the common wrong answers are wrong."
}`;

const TF_SHAPE = `{
  "type": "true_false",
  "skill": "Python",
  "topic": "List Comprehensions",
  "question_text": "...",
  "points": 1,
  "correct_answer": "true",
  "explanation": "2-4 sentences explaining why this is true/false with context."
}`;

const SA_SHAPE = `{
  "type": "short_answer",
  "skill": "System Design",
  "topic": "CAP Theorem",
  "question_text": "...",
  "points": 2,
  "model_answer": "The ideal 2-6 sentence answer to this question.",
  "grading_rubric": "Criteria for awarding full/partial marks.",
  "answer_keywords": ["key", "terms", "expected"],
  "explanation": "2-4 sentences of useful context about this topic."
}`;

const BASE_RULES = `Rules:
- MCQ: exactly 4 answer options, exactly 1 correct, options must be plausible distractors
- True/False: question must have one definitively correct answer
- Short Answer: requires a 2-6 sentence written response; test conceptual understanding
- Questions must be clear, professional, and directly test the provided skill/content
- Do NOT repeat similar questions
- Return ONLY valid JSON — no prose, no markdown
- ALWAYS include the "explanation" field on every question

Difficulty:
- easy: basic recall/definitions; junior-level
- medium: applied understanding; intermediate-level
- hard: advanced concepts, edge cases, architecture; senior-level`;

const SYSTEM_PROMPT = `You are an expert assessment question writer. Generate high-quality, unambiguous questions.

${BASE_RULES}

${METADATA_INSTRUCTION}

Return this exact JSON structure:
{
  "questions": [${MCQ_SHAPE}, ${TF_SHAPE}, ${SA_SHAPE}]
}`;

const SYSTEM_PROMPT_JD = `You are an expert assessment question writer for job-role skill assessments.

${BASE_RULES}
- Each question MUST include a "skill" field with the exact skill name it tests
- Distribute questions evenly across all skills

${METADATA_INSTRUCTION}

Return this exact JSON structure:
{
  "questions": [
    {
      "type": "mcq", "skill": "Python", "topic": "List Comprehensions",
      "question_text": "...", "points": 1,
      "options": [...],
      "explanation": "..."
    },
    {
      "type": "short_answer", "skill": "System Design", "topic": "CAP Theorem",
      "question_text": "...", "points": 2,
      "model_answer": "...", "grading_rubric": "...", "answer_keywords": [...],
      "explanation": "..."
    }
  ]
}`;

const DIFF_LABELS = {
  easy:   'Easy (basic recall and definitions, junior-level)',
  medium: 'Medium (applied understanding, intermediate-level)',
  hard:   'Hard (advanced concepts and edge cases, senior-level)',
};

// Scenario-based question instructions — injected for skills/jd modes only.
// content mode generates from pasted material so scenario framing would be off-topic.
function buildScenarioInstruction(difficulty) {
  if (difficulty === 'easy') {
    return `All questions must be direct knowledge or recall questions.
Do NOT use scenario-based framing. Ask about definitions, concepts, syntax, or straightforward facts.`;
  }
  if (difficulty === 'medium') {
    return `Generate a MIX of question types:
- Approximately 40% of questions should be SCENARIO-BASED: begin with a realistic workplace or coding situation (2-3 sentences), then ask what the candidate would do, what is wrong, or what the best approach is.
- Approximately 60% should be direct conceptual or factual questions.
For scenario questions, ground them in the specific skill(s) being tested — use starters like:
  "You are debugging a production issue where..."
  "A colleague's code review reveals that..."
  "Your team is two weeks from a deadline and..."
  "You are analysing a dataset and discover that..."
The correct answer should require genuine understanding. Wrong MCQ options should be plausible mistakes a real practitioner might make.`;
  }
  // hard
  return `Generate MOSTLY SCENARIO-BASED questions:
- Approximately 70% of questions should be SCENARIO-BASED: each scenario must describe a specific, realistic situation a professional would face (debugging, architecture decision, performance issue, security vulnerability, team conflict, etc.). The situation should be 2-4 sentences. Then ask the candidate to identify the problem, choose the best approach, or explain their reasoning.
- The remaining 30% may be advanced conceptual or analytical questions (trade-off analysis, "why does X happen", edge cases).
Use scenario starters like:
  "Your application is experiencing intermittent timeouts under peak load. You notice that..."
  "You need to design a system that handles 10,000 concurrent users. The primary constraint is..."
  "A user reports that [symptom]. After investigation you find..."
  "You are onboarding a new developer and notice the codebase..."
Hard questions must require reasoning, not recall. Avoid questions that can be answered by memorising a definition.`;
}

// ── POST — create session ─────────────────────────────────────────────────────

export async function POST(request) {
  try {
    const { user } = await requireUser(request);

    const balance = await getBalance(user.id);
    const COST = CREDIT_COSTS['test_create'];
    if (balance < COST) {
      return Response.json(
        { error: `Insufficient credits. This action costs ${COST} credits.`, code: 'insufficient_credits', balance },
        { status: 402 }
      );
    }

    const body = await request.json();
    const {
      input_type, input_data, jd_skills, difficulty, timer_minutes,
      question_types = ['mcq'],
      mcq_count: rawMcq,
      short_answer_count: rawSa,
      mix_ratios,          // { mcq: %, true_false: %, short_answer: % } — from Mixed mode
      // New: array of { id, name } from SkillLookupInput (optional, backward compat)
      skills: skillObjects,
    } = body;

    // Derive whether short answer is included
    const wantsMCQ = question_types.includes('mcq') || question_types.includes('true_false') || question_types.includes('mixed');
    const wantsSA  = question_types.includes('short_answer') || question_types.includes('mixed');
    const tfOnly   = question_types.length === 1 && question_types[0] === 'true_false';
    const mcqOnly  = question_types.length === 1 && question_types[0] === 'mcq';

    // Validation
    if (!['skills', 'content', 'jd'].includes(input_type)) {
      return Response.json({ error: 'Invalid input_type' }, { status: 400 });
    }
    if (input_type !== 'jd' && !input_data?.trim()) {
      return Response.json({ error: 'Please select at least one skill or enter your content before generating a test.' }, { status: 400 });
    }
    if (input_type === 'content' && input_data.trim().length < 100) {
      return Response.json({ error: 'Your content is too short to generate a test. Please add more detail (minimum 100 characters).' }, { status: 400 });
    }
    if (input_type === 'jd') {
      if (!Array.isArray(jd_skills) || jd_skills.length < 1) {
        return Response.json({ error: 'Please confirm at least one skill before generating.' }, { status: 400 });
      }
      if (jd_skills.length > 20) {
        return Response.json({ error: 'Maximum 20 skills allowed.' }, { status: 400 });
      }
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return Response.json({ error: 'Select a difficulty level.' }, { status: 400 });
    }
    const timer = parseInt(timer_minutes);
    if (isNaN(timer) || timer < 5 || timer > 180) {
      return Response.json({ error: 'Please enter a timer between 5 and 180 minutes.' }, { status: 400 });
    }

    const diffLabel = DIFF_LABELS[difficulty];

    // Calculate question counts
    let baseMcqCount, baseSaCount;
    if (input_type === 'skills') {
      const skills = input_data.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
      const total = Math.min(Math.max(skills.length * 5, 5), 20);
      if (wantsMCQ && wantsSA) {
        baseMcqCount = rawMcq ?? Math.round(total * 0.7);
        baseSaCount  = rawSa  ?? (total - baseMcqCount);
      } else if (wantsSA) {
        baseMcqCount = 0; baseSaCount = rawSa ?? total;
      } else {
        baseMcqCount = rawMcq ?? total; baseSaCount = 0;
      }
    } else if (input_type === 'content') {
      if (wantsMCQ && wantsSA) {
        baseMcqCount = rawMcq ?? 7; baseSaCount = rawSa ?? 3;
      } else if (wantsSA) {
        baseMcqCount = 0; baseSaCount = rawSa ?? 10;
      } else {
        baseMcqCount = rawMcq ?? 10; baseSaCount = 0;
      }
    } else {
      // jd
      const total = Math.min(Math.max(jd_skills.length * 3, 5), 20);
      if (wantsMCQ && wantsSA) {
        baseMcqCount = rawMcq ?? Math.round(total * 0.7);
        baseSaCount  = rawSa  ?? (total - baseMcqCount);
      } else if (wantsSA) {
        baseMcqCount = 0; baseSaCount = rawSa ?? total;
      } else {
        baseMcqCount = rawMcq ?? total; baseSaCount = 0;
      }
    }

    const mcqCount = Math.max(0, Math.min(20, baseMcqCount));
    const saCount  = Math.max(0, Math.min(10, baseSaCount));
    const totalCount = mcqCount + saCount;

    if (totalCount < 1) {
      return Response.json({ error: 'Please configure at least 1 question.' }, { status: 400 });
    }

    // ── Skill resolution ──────────────────────────────────────────────────────
    // Build resolved skill list with IDs: prefer client-supplied { id, name } objects,
    // fall back to parsing input_data text, then resolve each name to a DB skill_id.
    let libraryQuestions = [];
    let skills = [];           // canonical names for prompt building
    let resolvedSkills = [];   // [{ skill_id, skill_name }] with IDs

    const topicHintsMap = body.topic_hints || {};

    if (input_type === 'skills') {
      if (Array.isArray(skillObjects) && skillObjects.length) {
        // Client sent pre-resolved objects — use their IDs directly
        resolvedSkills = skillObjects.map(s => ({ skill_id: s.id || null, skill_name: s.name }));
        skills = resolvedSkills.map(r => r.skill_name).filter(Boolean);
      } else {
        // Legacy: parse from comma-separated input_data, resolve each
        const rawSkills = (input_data || '').split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
        skills = rawSkills;
        // Resolve asynchronously, non-blocking for prompt building
        resolvedSkills = await Promise.all(rawSkills.map(name => resolveSkill(name, user.id)));
      }
    } else if (input_type === 'jd') {
      skills = (jd_skills || []).map(s => s.name || '').filter(Boolean);
      resolvedSkills = await Promise.all(skills.map(name => resolveSkill(name, user.id)));
    }

    const skillIds = resolvedSkills.map(r => r.skill_id).filter(Boolean);

    // ── Save topic hints to skill_topics (fire-and-forget) ────────────────────
    if (input_type === 'skills' && Object.keys(topicHintsMap).length) {
      const skillNameToId = Object.fromEntries(
        resolvedSkills.filter(r => r.skill_id).map(r => [r.skill_name, r.skill_id])
      );
      Promise.allSettled(
        Object.entries(topicHintsMap)
          .filter(([, hint]) => hint?.trim())
          .map(([skillName, hint]) => {
            const id = skillNameToId[skillName];
            return id ? saveTopicHint(id, hint, 'user_hint') : Promise.resolve();
          })
      ).catch(() => {});
    }

    // Resolve topic hint values (names) for library query
    const topicHintValues = Object.values(topicHintsMap).map(t => t.trim()).filter(Boolean);

    // ── Library-first: fetch existing questions before calling AI ─────────────
    if (input_type !== 'content' && (skills.length || skillIds.length)) {
      libraryQuestions = await fetchFromLibrary({
        skills,
        skillIds,
        topics: topicHintValues,
        difficulty,
        questionTypes: question_types,
        requestedCount: mcqCount,
      });
      console.log(`[Library] fetched ${libraryQuestions.length} of ${mcqCount} MCQ/TF from library`);
    }

    // aiNeeded = total slots - what library provided
    const aiNeeded = totalCount - libraryQuestions.length;

    // Build prompt
    let valid = [...libraryQuestions];

    if (aiNeeded > 0) {
      const existingTexts = libraryQuestions.map(q => q.question_text);
      const dedupeNote = existingTexts.length
        ? `\n\nDo NOT generate questions similar to these already-covered topics:\n${existingTexts.map(t => `- ${t.slice(0, 80)}`).join('\n')}`
        : '';

      // Adjust type distribution based on what library already provided
      const libMcqCount = libraryQuestions.filter(q => q.type !== 'short_answer').length;
      const libSaCount  = libraryQuestions.filter(q => q.type === 'short_answer').length;
      const aiMcqNeeded = Math.max(0, mcqCount - libMcqCount);
      const aiSaNeeded  = Math.max(0, saCount  - libSaCount);
      const aiTotal     = aiMcqNeeded + aiSaNeeded;

      // Split aiMcqNeeded into exact MCQ vs TF counts using mix_ratios when available
      const wantsMcqType = question_types.includes('mcq');
      const wantsTfType  = question_types.includes('true_false');
      let aiMcqOnly, aiTfOnly;
      if (mcqOnly) {
        aiMcqOnly = aiMcqNeeded; aiTfOnly = 0;
      } else if (tfOnly) {
        aiMcqOnly = 0; aiTfOnly = aiMcqNeeded;
      } else if (wantsMcqType && wantsTfType && mix_ratios) {
        const mcqPct = mix_ratios.mcq ?? 0;
        const tfPct  = mix_ratios.true_false ?? 0;
        const total  = mcqPct + tfPct;
        aiMcqOnly = total > 0 ? Math.round(aiMcqNeeded * mcqPct / total) : Math.ceil(aiMcqNeeded / 2);
        aiTfOnly  = aiMcqNeeded - aiMcqOnly;
      } else if (wantsMcqType && !wantsTfType) {
        aiMcqOnly = aiMcqNeeded; aiTfOnly = 0;
      } else if (!wantsMcqType && wantsTfType) {
        aiMcqOnly = 0; aiTfOnly = aiMcqNeeded;
      } else {
        aiMcqOnly = Math.ceil(aiMcqNeeded / 2); aiTfOnly = aiMcqNeeded - aiMcqOnly;
      }

      // Build a precise type distribution string for the prompt
      const typeParts = [];
      if (aiMcqOnly > 0) typeParts.push(`${aiMcqOnly} MCQ question${aiMcqOnly > 1 ? 's' : ''} — type must be "mcq", exactly 4 options, one correct`);
      if (aiTfOnly  > 0) typeParts.push(`${aiTfOnly} True/False question${aiTfOnly > 1 ? 's' : ''} — type must be "true_false", a definitively true or false statement`);
      if (aiSaNeeded > 0) typeParts.push(`${aiSaNeeded} Short Answer question${aiSaNeeded > 1 ? 's' : ''} — type must be "short_answer", requires a 2-6 sentence written response`);
      const typeDescription = typeParts.join('\n- ');

      let userPrompt, systemPrompt;

      if (input_type === 'skills') {
        const scenarioBlock = buildScenarioInstruction(difficulty);
        systemPrompt = SYSTEM_PROMPT;
        const skillContext = skills.map(s => {
          const hint = topicHintsMap[s]?.trim();
          return hint ? `${s} (focus: ${hint})` : s;
        }).join(', ');
        userPrompt = `Generate exactly ${aiTotal} ${diffLabel} questions about these skills/topics: ${skillContext}\n\nRequired type breakdown (MUST follow exactly):\n- ${typeDescription}\n\n${scenarioBlock}${dedupeNote}`;
      } else if (input_type === 'content') {
        systemPrompt = SYSTEM_PROMPT;
        userPrompt = `Generate exactly ${aiTotal} ${diffLabel} questions based on this content:\n\n${input_data.trim()}\n\nRequired type breakdown (MUST follow exactly):\n- ${typeDescription}`;
      } else {
        systemPrompt = SYSTEM_PROMPT_JD;
        const skillList = jd_skills.map(s => `- ${s.name} (${s.type})`).join('\n');
        const scenarioBlock = buildScenarioInstruction(difficulty);
        userPrompt = `Generate exactly ${aiTotal} ${diffLabel} questions for this job role.\n\nSkills (distribute evenly):\n${skillList}\n\nRequired type breakdown (MUST follow exactly):\n- ${typeDescription}\nEach question must include the "skill" field.\n\n${scenarioBlock}${dedupeNote}`;
      }

      const generated = await callAI(userPrompt, systemPrompt);
      console.log('AI raw question count:', generated?.questions?.length);

      // Build skill-name → skill_id lookup for stamping onto questions
      const skillNameToId = Object.fromEntries(
        resolvedSkills.filter(r => r.skill_id).map(r => [r.skill_name.toLowerCase(), r.skill_id])
      );

      const normalized = (generated?.questions || []).map(q => {
        const nq = {
          ...normalizeQuestion(q),
          difficulty: q.difficulty || difficulty,
        };
        // Stamp skill_id when the AI's skill field matches a resolved skill
        if (nq.skill && !nq.skill_id) {
          nq.skill_id = skillNameToId[nq.skill.toLowerCase()] || skillIds[0] || null;
        }
        return nq;
      });
      const aiValid = normalized.filter(q => {
        if (!['mcq', 'true_false', 'short_answer'].includes(q.type)) return false;
        if (!q.question_text?.trim()) return false;
        if (q.type === 'mcq' && (!Array.isArray(q.options) || q.options.length < 2)) return false;
        if (q.type === 'mcq' && !q.options.some(o => o.is_correct)) return false;
        if (q.type === 'true_false' && !['true', 'false'].includes(q.correct_answer)) return false;
        if (q.type === 'short_answer' && !q.model_answer?.trim()) return false;
        return true;
      }).slice(0, aiNeeded);

      console.log('Valid AI question count:', aiValid.length);

      // Combine library + AI and shuffle
      valid = [...libraryQuestions, ...aiValid].sort(() => Math.random() - 0.5).slice(0, totalCount);
    }

    console.log('Total valid questions:', valid.length);
    if (!valid.length) {
      return Response.json({
        error: 'We were unable to generate questions at this time. Please try again.',
      }, { status: 422 });
    }

    const actualMcq = valid.filter(q => q.type !== 'short_answer').length;
    const actualSa  = valid.filter(q => q.type === 'short_answer').length;

    const insertRow = {
      user_id:             user.id,
      input_type,
      input_data:          input_type === 'jd' ? (input_data || '') : input_data.trim(),
      difficulty,
      timer_minutes:       timer,
      questions:           valid,
      question_count:      valid.length,
      status:              'ready',
      question_types,
      mcq_count:           actualMcq,
      short_answer_count:  actualSa,
      grading_method:      wantsSA ? 'ai' : null,
    };
    if (input_type === 'jd') insertRow.jd_skills = jd_skills;

    let session;
    {
      const { data, error: sErr } = await supabase
        .from('self_test_sessions')
        .insert(insertRow)
        .select('id, input_type, question_count, difficulty, timer_minutes, status, created_at, question_types, mcq_count, short_answer_count, grading_method')
        .single();

      if (sErr && input_type === 'jd' && sErr.message?.includes('jd_skills')) {
        const { jd_skills: _drop, ...rowWithout } = insertRow;
        const { data: d2, error: e2 } = await supabase
          .from('self_test_sessions')
          .insert(rowWithout)
          .select('id, input_type, question_count, difficulty, timer_minutes, status, created_at, question_types, mcq_count, short_answer_count, grading_method')
          .single();
        if (e2) throw e2;
        session = d2;
      } else {
        // Graceful fallback: new columns may not exist yet
        if (sErr?.message?.includes('question_types') || sErr?.message?.includes('mcq_count')) {
          const { question_types: _a, mcq_count: _b, short_answer_count: _c, grading_method: _d, ...rowCompat } = insertRow;
          const { data: d3, error: e3 } = await supabase
            .from('self_test_sessions')
            .insert(rowCompat)
            .select('id, input_type, question_count, difficulty, timer_minutes, status, created_at')
            .single();
          if (e3) throw e3;
          session = d3;
        } else {
          if (sErr) throw sErr;
          session = data;
        }
      }
    }

    // Fire-and-forget: auto-save AI questions + increment times_used for library questions
    if (input_type !== 'content') {
      saveQuestionsToLibrary(valid, session.id, user.id, input_type).catch(err => {
        console.error('[Library] Auto-save failed:', err.message);
      });
      // Save AI-inferred topics to skill_topics
      saveAIInferredTopics(valid).catch(() => {});
    }

    const { ok, balance: newBalance } = await deductCredits(user.id, 'test_create');
    if (!ok) return Response.json({ error: 'Insufficient credits.', code: 'insufficient_credits', balance: 0 }, { status: 402 });

    return Response.json({ session, credits_used: COST, credits_remaining: newBalance }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── GET — session history ─────────────────────────────────────────────────────

export async function GET(request) {
  try {
    const { user } = await requireUser(request);
    const { data, error } = await supabase
      .from('self_test_sessions')
      .select(`
        id, input_type, input_data, difficulty, timer_minutes,
        question_count, status, created_at, question_types, mcq_count, short_answer_count,
        self_test_attempts (
          id, score, max_score, submitted_at, auto_submitted, combined_pct
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);
    if (error) throw error;
    return Response.json({ history: data || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ── normalizeQuestion — handle AI field name variants ─────────────────────────
function normalizeQuestion(q) {
  if (!q || typeof q !== 'object') return q;
  const out = { ...q };

  // question_text aliases
  out.question_text = q.question_text || q.question || q.text || q.questionText || '';

  // type aliases + lowercase
  const rawType = (q.type || q.question_type || q.questionType || 'mcq').toLowerCase();
  out.type = rawType === 'short answer' || rawType === 'shortanswer' ? 'short_answer'
    : rawType === 'true/false' || rawType === 'truefalse' ? 'true_false'
    : rawType;

  // preserve skill + topic from AI response
  out.skill  = q.skill  || null;
  out.topic  = q.topic  || null;

  // points
  out.points = q.points || (out.type === 'short_answer' ? 2 : 1);

  // MCQ: normalise options.is_correct
  if (out.type === 'mcq' && Array.isArray(q.options)) {
    out.options = q.options.map(opt => ({
      ...opt,
      option_text: opt.option_text || opt.text || opt.option || opt.value || '',
      is_correct:  opt.is_correct ?? opt.correct ?? opt.isCorrect ?? opt.is_right ?? false,
    }));
  }

  // True/false: normalise correct_answer
  if (out.type === 'true_false') {
    const ca = q.correct_answer ?? q.correctAnswer ?? q.answer ?? q.correct;
    out.correct_answer = String(ca).toLowerCase() === 'true' ? 'true' : 'false';
  }

  // Short answer: normalise model_answer
  if (out.type === 'short_answer') {
    out.model_answer = q.model_answer || q.modelAnswer || q.answer || q.correct_answer || q.sample_answer || q.ideal_answer || q.solution || '';
    out.grading_rubric  = q.grading_rubric  || q.gradingRubric  || q.rubric   || '';
    out.answer_keywords = q.answer_keywords || q.answerKeywords || q.keywords || [];
  }

  return out;
}

// ── callAI ────────────────────────────────────────────────────────────────────

async function callAI(userContent, systemPrompt = SYSTEM_PROMPT) {
  return callGemini(userContent, { system: systemPrompt, json: true, temperature: 0.7 });
}

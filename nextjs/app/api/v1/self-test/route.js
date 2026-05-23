import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

// ── System prompts ────────────────────────────────────────────────────────────

const MCQ_SHAPE = `{
  "type": "mcq",
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
  "question_text": "...",
  "points": 1,
  "correct_answer": "true",
  "explanation": "2-4 sentences explaining why this is true/false with context."
}`;

const SA_SHAPE = `{
  "type": "short_answer",
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

Return this exact JSON structure:
{
  "questions": [${MCQ_SHAPE}, ${TF_SHAPE}, ${SA_SHAPE}]
}`;

const SYSTEM_PROMPT_JD = `You are an expert assessment question writer for job-role skill assessments.

${BASE_RULES}
- Each question MUST include a "skill" field with the exact skill name it tests
- Distribute questions evenly across all skills

Return this exact JSON structure:
{
  "questions": [
    {
      "type": "mcq", "skill": "Python",
      "question_text": "...", "points": 1,
      "options": [...],
      "explanation": "..."
    },
    {
      "type": "short_answer", "skill": "System Design",
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
    const body = await request.json();
    const {
      input_type, input_data, jd_skills, difficulty, timer_minutes,
      question_types = ['mcq'],
      mcq_count: rawMcq,
      short_answer_count: rawSa,
    } = body;

    // Derive whether short answer is included
    const wantsMCQ = question_types.includes('mcq') || question_types.includes('mixed');
    const wantsSA  = question_types.includes('short_answer') || question_types.includes('mixed');

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

    // Build prompt
    let userPrompt, systemPrompt;
    const typeDescription = wantsMCQ && wantsSA
      ? `${mcqCount} MCQ/True-False questions and ${saCount} Short Answer questions`
      : wantsSA
        ? `${saCount} Short Answer questions only`
        : `${mcqCount} MCQ/True-False questions (distribute evenly between MCQ and True/False)`;

    if (input_type === 'skills') {
      const skills = input_data.split(/[,\n]+/).map(s => s.trim()).filter(Boolean);
      const scenarioBlock = buildScenarioInstruction(difficulty);
      systemPrompt = SYSTEM_PROMPT;
      userPrompt = `Generate exactly ${totalCount} ${diffLabel} questions about these skills/topics: ${skills.join(', ')}\n\nDistribution: ${typeDescription}\nFor MCQ/TF: distribute evenly between MCQ and True/False.\nFor Short Answer: require 2-6 sentence written responses.\n\n${scenarioBlock}`;
    } else if (input_type === 'content') {
      systemPrompt = SYSTEM_PROMPT;
      userPrompt = `Generate exactly ${totalCount} ${diffLabel} questions based on this content:\n\n${input_data.trim()}\n\nDistribution: ${typeDescription}`;
    } else {
      systemPrompt = SYSTEM_PROMPT_JD;
      const skillList = jd_skills.map(s => `- ${s.name} (${s.type})`).join('\n');
      const scenarioBlock = buildScenarioInstruction(difficulty);
      userPrompt = `Generate exactly ${totalCount} ${diffLabel} questions for this job role.\n\nSkills (distribute evenly):\n${skillList}\n\nDistribution: ${typeDescription}\nEach question must include the "skill" field.\n\n${scenarioBlock}`;
    }

    const generated = await callAI(userPrompt, systemPrompt);
    console.log('AI raw question count:', generated?.questions?.length);
    console.log('AI questions sample:', JSON.stringify(generated?.questions?.[0]));

    const normalized = (generated?.questions || []).map(normalizeQuestion);
    console.log('Normalized sample:', JSON.stringify(normalized?.[0]));

    const valid = normalized.filter(q => {
      if (!['mcq', 'true_false', 'short_answer'].includes(q.type)) return false;
      if (!q.question_text?.trim()) return false;
      if (q.type === 'mcq' && (!Array.isArray(q.options) || q.options.length < 2)) return false;
      if (q.type === 'mcq' && !q.options.some(o => o.is_correct)) return false;
      if (q.type === 'true_false' && !['true', 'false'].includes(q.correct_answer)) return false;
      if (q.type === 'short_answer' && !q.model_answer?.trim()) return false;
      return true;
    }).slice(0, totalCount);

    console.log('Valid question count after filter:', valid.length);
    if (!valid.length) {
      console.error('All questions rejected — first normalized:', JSON.stringify(normalized[0]));
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

    return Response.json({ session }, { status: 201 });
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
  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user',   content: userContent },
  ];

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta-llama/llama-3.3-70b-instruct:free',
        messages,
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return JSON.parse(text);
    } else {
      console.error('OpenRouter failed:', resp.status, await resp.text().catch(() => ''));
    }
  } catch (e) { console.error('OpenRouter error:', e.message); }

  console.log('Falling back to Groq...');
  const { Groq } = await import('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    messages,
    temperature: 0.7,
    response_format: { type: 'json_object' },
  });
  const text = completion.choices?.[0]?.message?.content;
  return JSON.parse(text);
}

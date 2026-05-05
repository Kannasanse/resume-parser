import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an expert assessment question writer. Generate high-quality, unambiguous questions suitable for professional skill assessments.

Rules:
- MCQ: exactly 4 answer options, exactly 1 correct, options must be plausible distractors
- True/False: question must have one definitively correct answer
- Questions must be clear, professional, and directly test the provided skill/content
- Do NOT repeat similar questions
- Return ONLY valid JSON — no prose, no markdown

Difficulty calibration:
- easy: basic recall and definitions; a junior developer should know this without looking it up
- medium: applied understanding; requires knowing how things work, not just what they are called
- hard: advanced concepts, edge cases, architecture decisions, subtle gotchas; senior-level knowledge

Return this exact JSON structure:
{
  "questions": [
    {
      "type": "mcq",
      "question_text": "...",
      "points": 1,
      "options": [
        {"option_text": "...", "is_correct": false},
        {"option_text": "...", "is_correct": true},
        {"option_text": "...", "is_correct": false},
        {"option_text": "...", "is_correct": false}
      ]
    },
    {
      "type": "true_false",
      "question_text": "...",
      "points": 1,
      "correct_answer": "true"
    }
  ]
}`;

const DIFF_LABELS = {
  easy:   'Easy (basic recall and definitions, junior-level)',
  medium: 'Medium (applied understanding, intermediate-level)',
  hard:   'Hard (advanced concepts and edge cases, senior-level)',
};

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { input_type, input_data, difficulty, timer_minutes } = await request.json();

    if (!['skills', 'content'].includes(input_type)) {
      return Response.json({ error: 'Invalid input_type' }, { status: 400 });
    }
    if (!input_data?.trim()) {
      return Response.json({ error: 'Please select at least one skill or enter your content before generating a test.' }, { status: 400 });
    }
    if (input_type === 'content' && input_data.trim().length < 100) {
      return Response.json({ error: 'Your content is too short to generate a test. Please add more detail (minimum 100 characters).' }, { status: 400 });
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return Response.json({ error: 'Select a difficulty level.' }, { status: 400 });
    }
    const timer = parseInt(timer_minutes);
    if (isNaN(timer) || timer < 5 || timer > 180) {
      return Response.json({ error: 'Please enter a timer between 5 and 180 minutes.' }, { status: 400 });
    }

    // Determine question count
    const skills = input_type === 'skills'
      ? input_data.split(/[,\n]+/).map(s => s.trim()).filter(Boolean)
      : [];
    const count = input_type === 'skills'
      ? Math.min(Math.max(skills.length * 5, 5), 20)
      : 10;

    const diffLabel = DIFF_LABELS[difficulty];
    const types = 'Multiple Choice (MCQ), True/False';
    const userPrompt = input_type === 'skills'
      ? `Generate exactly ${count} ${diffLabel} questions about these skills/topics: ${skills.join(', ')}\nQuestion types to use (distribute evenly): ${types}`
      : `Generate exactly ${count} ${diffLabel} questions based on this content:\n\n${input_data.trim()}\n\nQuestion types to use (distribute evenly): ${types}`;

    const generated = await callAI(userPrompt);

    const valid = (generated?.questions || []).filter(q => {
      if (!['mcq', 'true_false'].includes(q.type)) return false;
      if (!q.question_text?.trim()) return false;
      if (q.type === 'mcq' && (!Array.isArray(q.options) || q.options.length < 2)) return false;
      if (q.type === 'mcq' && !q.options.some(o => o.is_correct)) return false;
      if (q.type === 'true_false' && !['true', 'false'].includes(q.correct_answer)) return false;
      return true;
    }).slice(0, count);

    if (!valid.length) {
      return Response.json({
        error: input_type === 'content' && difficulty === 'hard'
          ? `Not enough content to generate Hard questions. Try a lower difficulty or add more content.`
          : 'We were unable to generate questions at this time. Please try again.',
      }, { status: 422 });
    }

    const { data: session, error: sErr } = await supabase
      .from('self_test_sessions')
      .insert({
        user_id:        user.id,
        input_type,
        input_data:     input_data.trim(),
        difficulty,
        timer_minutes:  timer,
        questions:      valid,
        question_count: valid.length,
        status:         'ready',
      })
      .select('id, question_count, difficulty, timer_minutes, status, created_at')
      .single();
    if (sErr) throw sErr;

    return Response.json({ session }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function GET(request) {
  try {
    const { user } = await requireUser(request);
    const { data, error } = await supabase
      .from('self_test_sessions')
      .select(`
        id, input_type, input_data, difficulty, timer_minutes,
        question_count, status, created_at,
        self_test_attempts (
          id, score, max_score, submitted_at, auto_submitted
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

async function callAI(userContent) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: userContent },
  ];

  try {
    const resp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
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
    }
  } catch (_) {}

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

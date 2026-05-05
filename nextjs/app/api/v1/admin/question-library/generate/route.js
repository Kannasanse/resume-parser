import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an expert assessment question writer. Generate high-quality, unambiguous questions suitable for professional skill assessments.

Rules:
- MCQ: exactly 4 answer options, exactly 1 correct, options must be plausible distractors
- True/False: question must have one definitively correct answer
- Short Answer: question must have a clear, specific expected answer (include it in "expected_answer")
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
    },
    {
      "type": "short_answer",
      "question_text": "...",
      "points": 2,
      "expected_answer": "..."
    }
  ]
}`;

const DIFF_LABELS = {
  easy:   'Easy (basic recall and definitions, junior-level)',
  medium: 'Medium (applied understanding, intermediate-level)',
  hard:   'Hard (advanced concepts and edge cases, senior-level)',
};

const TYPE_LABELS = { mcq: 'Multiple Choice (MCQ)', true_false: 'True/False', short_answer: 'Short Answer' };

export async function POST(request) {
  try {
    await requireAdmin(request);
    const { input_type, input, count, types, difficulty_mode = 'single', difficulty, distribution } = await request.json();

    if (!input?.trim()) return Response.json({ error: 'input is required' }, { status: 400 });
    if (input_type === 'content' && input.trim().length < 50) {
      return Response.json({ error: 'Please paste more content for the AI to generate meaningful questions.' }, { status: 400 });
    }
    if (input_type === 'content' && input.length > 10000) {
      return Response.json({ error: 'Content is too long. Please limit to 10,000 characters.' }, { status: 400 });
    }
    const n = parseInt(count);
    if (isNaN(n) || n < 1 || n > 50) return Response.json({ error: 'Please select between 1 and 50 questions.' }, { status: 400 });
    if (!Array.isArray(types) || !types.length) return Response.json({ error: 'Select at least one question type.' }, { status: 400 });

    if (difficulty_mode === 'mixed') {
      const slots = Object.entries(distribution || {})
        .filter(([k, v]) => ['easy', 'medium', 'hard'].includes(k) && v > 0)
        .map(([k, v]) => [k, parseInt(v)]);

      if (!slots.length) {
        return Response.json({ error: 'Specify at least one difficulty count in the distribution.' }, { status: 400 });
      }

      const results = await Promise.allSettled(
        slots.map(([diff, diffCount]) => runGeneration(input_type, input, diffCount, types, diff))
      );

      const allQuestions = [];
      const actualDistribution = {};
      const shortfalls = {};

      for (let i = 0; i < slots.length; i++) {
        const [diff, requested] = slots[i];
        const qs = results[i].status === 'fulfilled' ? results[i].value : [];
        const tagged = qs.map(q => ({ ...q, difficulty: diff }));
        allQuestions.push(...tagged);
        actualDistribution[diff] = tagged.length;
        if (tagged.length < requested) shortfalls[diff] = { requested, generated: tagged.length };
      }

      if (!allQuestions.length) {
        return Response.json({ error: "We couldn't generate questions from this content. Try adding more detail or different keywords." }, { status: 422 });
      }

      return Response.json({
        questions: allQuestions,
        requested: n,
        generated: allQuestions.length,
        actualDistribution,
        ...(Object.keys(shortfalls).length && { shortfalls }),
      });
    }

    // Single difficulty mode
    if (!difficulty || !DIFF_LABELS[difficulty]) {
      return Response.json({ error: 'Select a difficulty level.' }, { status: 400 });
    }

    const qs = await runGeneration(input_type, input, n, types, difficulty);
    const tagged = (qs || []).map(q => ({ ...q, difficulty }));

    if (!tagged.length) {
      return Response.json({ error: "We couldn't generate questions from this content. Try adding more detail or different keywords." }, { status: 422 });
    }

    return Response.json({
      questions: tagged,
      requested: n,
      generated: tagged.length,
      ...(tagged.length < n && { shortfalls: { [difficulty]: { requested: n, generated: tagged.length } } }),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Question generation failed. Please try again.' }, { status: 500 });
  }
}

async function runGeneration(input_type, input, count, types, difficulty) {
  const typeList = types.map(t => TYPE_LABELS[t]).join(', ');
  const diffLabel = DIFF_LABELS[difficulty] || difficulty;

  const userPrompt = input_type === 'skills'
    ? `Generate exactly ${count} ${diffLabel} questions about these skills/topics: ${input.trim()}\nQuestion types to use (distribute evenly): ${typeList}`
    : `Generate exactly ${count} ${diffLabel} questions based on this content:\n\n${input.trim()}\n\nQuestion types to use (distribute evenly): ${typeList}`;

  const generated = await callAI(userPrompt);
  if (!generated?.questions?.length) return [];

  return generated.questions.filter(q => {
    if (!types.includes(q.type)) return false;
    if (!q.question_text?.trim()) return false;
    if (q.type === 'mcq' && (!Array.isArray(q.options) || q.options.length < 2)) return false;
    if (q.type === 'mcq' && !q.options.some(o => o.is_correct)) return false;
    return true;
  }).slice(0, count);
}

async function callAI(userContent) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user',   content: userContent },
  ];

  // Try OpenRouter first
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

  // Groq fallback
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

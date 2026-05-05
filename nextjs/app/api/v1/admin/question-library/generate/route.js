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

export async function POST(request) {
  try {
    await requireAdmin(request);
    const { input_type, input, count, types } = await request.json();

    if (!input?.trim()) {
      return Response.json({ error: 'input is required' }, { status: 400 });
    }
    if (input_type === 'content' && input.trim().length < 50) {
      return Response.json({ error: 'Please paste more content for the AI to generate meaningful questions.' }, { status: 400 });
    }
    if (input_type === 'content' && input.length > 10000) {
      return Response.json({ error: 'Content is too long. Please limit to 10,000 characters.' }, { status: 400 });
    }
    const n = parseInt(count);
    if (isNaN(n) || n < 1 || n > 50) {
      return Response.json({ error: 'Please select between 1 and 50 questions.' }, { status: 400 });
    }
    if (!Array.isArray(types) || !types.length) {
      return Response.json({ error: 'Select at least one question type.' }, { status: 400 });
    }

    const typeLabels = { mcq: 'Multiple Choice (MCQ)', true_false: 'True/False', short_answer: 'Short Answer' };
    const typeList   = types.map(t => typeLabels[t]).join(', ');
    const userPrompt = input_type === 'skills'
      ? `Generate exactly ${n} questions about these skills/topics: ${input.trim()}\nQuestion types to use (distribute evenly): ${typeList}`
      : `Generate exactly ${n} questions based on this content:\n\n${input.trim()}\n\nQuestion types to use (distribute evenly): ${typeList}`;

    const generated = await callAI(userPrompt);

    if (!generated?.questions?.length) {
      return Response.json({ error: "We couldn't generate questions from this content. Try adding more detail or different keywords." }, { status: 422 });
    }

    // Filter to only requested types and validate structure
    const valid = generated.questions.filter(q => {
      if (!types.includes(q.type)) return false;
      if (!q.question_text?.trim()) return false;
      if (q.type === 'mcq' && (!Array.isArray(q.options) || q.options.length < 2)) return false;
      if (q.type === 'mcq' && !q.options.some(o => o.is_correct)) return false;
      return true;
    }).slice(0, n);

    if (!valid.length) {
      return Response.json({ error: "The AI returned malformed questions. Please try again." }, { status: 422 });
    }

    return Response.json({
      questions: valid,
      requested: n,
      generated: valid.length,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Question generation failed. Please try again.' }, { status: 500 });
  }
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

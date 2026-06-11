import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a precise quiz answer evaluator. Evaluate the student's answer against the model answer and return a JSON score. Return ONLY valid JSON, no prose.`;

async function callAI(userContent) {
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
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
        temperature: 0.1,
        response_format: { type: 'json_object' },
      }),
    });
    if (resp.ok) {
      const data = await resp.json();
      const text = data.choices?.[0]?.message?.content;
      if (text) return JSON.parse(text);
    }
  } catch (e) { console.error('OpenRouter error:', e.message); }

  const { Groq } = await import('groq-sdk');
  const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    messages,
    temperature: 0.1,
    response_format: { type: 'json_object' },
  });
  const text = completion.choices?.[0]?.message?.content;
  return JSON.parse(text);
}

export async function POST(request) {
  try {
    await requireUser(request);
    const { questionText, modelAnswer, userAnswer } = await request.json();

    if (!questionText || !modelAnswer || !userAnswer?.trim()) {
      return Response.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const prompt = `Evaluate this quiz answer.

Question: ${questionText}
Model answer: ${modelAnswer}
Student's answer: ${userAnswer}

Rate on:
  accuracy (0–4): Is the core concept correct?
  completeness (0–3): Are the key points covered?
  clarity (0–3): Is it clearly expressed?

Return exactly this JSON:
{
  "accuracy": 0-4,
  "completeness": 0-3,
  "clarity": 0-3,
  "total": 0-10,
  "feedback": "One sentence of specific, constructive feedback.",
  "keysCovered": ["concept covered"],
  "keysMissed": ["concept missed"]
}`;

    const result = await callAI(prompt);

    // Clamp and validate
    const accuracy     = Math.max(0, Math.min(4,  parseInt(result.accuracy     ?? 0)));
    const completeness = Math.max(0, Math.min(3,  parseInt(result.completeness ?? 0)));
    const clarity      = Math.max(0, Math.min(3,  parseInt(result.clarity      ?? 0)));
    const total        = accuracy + completeness + clarity;

    return Response.json({
      accuracy,
      completeness,
      clarity,
      total,
      feedback:     result.feedback     || '',
      keysCovered:  Array.isArray(result.keysCovered) ? result.keysCovered : [],
      keysMissed:   Array.isArray(result.keysMissed)  ? result.keysMissed  : [],
    });
  } catch (err) {
    console.error('[evaluate-short-answer]', err.message);
    return Response.json({ error: 'Evaluation failed.' }, { status: 500 });
  }
}

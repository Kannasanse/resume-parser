import { requireUser } from '@/lib/auth-helpers.js';
import { callGemini } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are a precise quiz answer evaluator. Evaluate the student's answer against the model answer and return a JSON score. Return ONLY valid JSON, no prose.`;

async function callAI(userContent) {
  return callGemini(userContent, { system: SYSTEM_PROMPT, json: true, temperature: 0.7 });
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

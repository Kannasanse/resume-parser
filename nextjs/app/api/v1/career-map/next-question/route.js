import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { sessionId, extractedProfile, previousQuestions = [], questionNumber } = await request.json();

    // Verify session ownership
    const { data: session } = await supabase
      .from('career_map_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const prompt = buildPrompt(extractedProfile, previousQuestions, questionNumber);

    const completion = await groq.chat.completions.create({
      model:           'llama-3.3-70b-versatile',
      temperature:     0.7,
      max_tokens:      600,
      response_format: { type: 'json_object' },
      messages:        [{ role: 'user', content: prompt }],
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from AI');

    const raw = JSON.parse(text);

    // Normalise field names
    const question = {
      questionNumber,
      questionText:   raw.questionText   || raw.question_text   || '',
      questionType:   raw.questionType   || raw.question_type   || 'options',
      questionIntent: raw.questionIntent || raw.question_intent || '',
      options:        raw.options        || null,
      placeholder:    raw.placeholder    || null,
      maxLength:      raw.maxLength      || raw.max_length      || (raw.questionType === 'free_text' ? 300 : null),
    };

    const confidenceAfter = Math.max(0, Math.min(1, parseFloat(raw.confidenceAfter ?? raw.confidence_after ?? 0)));
    const shouldContinue  = raw.shouldContinue ?? raw.should_continue ?? true;
    const stopReason      = raw.stopReason || raw.stop_reason || null;

    // Enforce: must ask at least 5 before stopping
    const effectiveContinue = questionNumber < 5 ? true : shouldContinue;

    // Save question row to DB (unanswered — answer saved by submit-answer)
    try {
      await supabase
        .from('career_map_questions')
        .upsert({
          session_id:      sessionId,
          question_number: questionNumber,
          question_text:   question.questionText,
          question_type:   question.questionType,
          question_intent: question.questionIntent,
          options:         question.options,
          confidence_after: confidenceAfter,
          should_continue: effectiveContinue,
        }, { onConflict: 'session_id,question_number' });
    } catch (_) {}

    return NextResponse.json({
      question,
      confidenceAfter,
      shouldContinue: effectiveContinue,
      stopReason: effectiveContinue ? null : stopReason,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('next-question error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

function buildPrompt(profile, previousQuestions, questionNumber) {
  const prevText = previousQuestions.length === 0
    ? 'None yet — this is the first question.'
    : previousQuestions.map(q =>
        `Q${q.questionNumber}: ${q.questionText}\nAnswer: ${q.answerLabel || q.answerValue}`
      ).join('\n\n');

  const minRemaining = Math.max(0, 5 - questionNumber + 1);
  const maxRemaining = 10 - questionNumber + 1;

  return `You are an adaptive career advisor conducting a personalised career assessment.

Your goal is to understand this professional's career goals, preferences, and constraints well enough to recommend the most relevant career paths for them.

Candidate profile (from their resume):
${JSON.stringify(profile, null, 2)}

Questions asked so far and their answers:
${prevText}

You need to generate question number ${questionNumber}.

Rules for question generation:
1. Each question must reveal something NEW that you don't already know from the resume or previous answers
2. Do NOT repeat themes already covered — check previous questions carefully
3. Make questions specific to this person — reference their actual job titles, skills, or industries
4. Alternate between preference questions (options) and exploratory questions (free text)
5. Options questions: provide exactly 4 options that are meaningfully different, not just variations
6. Free text questions: ask open-ended questions about aspirations, values, or context
7. Questions must be conversational, not bureaucratic — avoid corporate jargon
8. After question 5, evaluate if you have enough signal to make confident recommendations

Question intents to cover (pick the most relevant ones based on what's missing):
- Career direction (growth vs transition vs leadership vs exploration)
- Timeline and urgency (how soon they want to move)
- Work environment preferences (remote, team size, startup vs enterprise)
- Salary expectations and priorities
- Learning commitment (how much time for upskilling)
- Geographic constraints (open to relocation or not)
- Specific industries or domains they're drawn to
- What they disliked about past roles (reveals what to avoid)
- Their biggest strength they want to leverage
- Risk tolerance (safe incremental move vs ambitious leap)

Current confidence assessment:
- Low (< 0.5): Ask more to understand basic direction
- Medium (0.5–0.84): Getting clearer, 1–3 more questions useful
- High (>= 0.85): Enough signal to generate good recommendations — consider stopping

${questionNumber >= 5
  ? `You have asked ${questionNumber - 1} questions. Evaluate your confidence honestly.
If you have strong signal on direction, timeline, preferences, and constraints → set shouldContinue: false.
If major gaps remain → continue (max ${maxRemaining} more question${maxRemaining !== 1 ? 's' : ''}).`
  : `You must ask at least ${minRemaining} more question${minRemaining !== 1 ? 's' : ''} before stopping. Set shouldContinue: true.`
}

Return ONLY valid JSON with lowercase keys exactly as shown:
{
  "questionText": "The question to ask",
  "questionType": "options",
  "questionIntent": "one phrase describing what this reveals",
  "options": [
    { "id": "a", "label": "Display label", "value": "semantic_value" },
    { "id": "b", "label": "Display label", "value": "semantic_value" },
    { "id": "c", "label": "Display label", "value": "semantic_value" },
    { "id": "d", "label": "Display label", "value": "semantic_value" }
  ],
  "placeholder": null,
  "maxLength": null,
  "confidenceAfter": 0.0,
  "shouldContinue": true,
  "stopReason": null
}

For free_text questions: set questionType to "free_text", options to null, provide a placeholder string, set maxLength to 300.
For options questions: set placeholder and maxLength to null, provide exactly 4 options.
shouldContinue must be false only if confidenceAfter >= 0.85 AND questionNumber >= 5, OR questionNumber = 10.
stopReason: "confident" if stopping due to confidence, "max_questions" if at limit, null otherwise.`;
}

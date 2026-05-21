import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { sessionId, extractedProfile, previousQuestions = [], questionNumber, mode = 'resume', selectedSkills = [] } = await request.json();

    // Verify session ownership
    const { data: session } = await supabase
      .from('career_map_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const prompt = mode === 'skills'
      ? buildSkillsPrompt(selectedSkills, previousQuestions, questionNumber)
      : buildPrompt(extractedProfile, previousQuestions, questionNumber);

    const completion = await groq.chat.completions.create({
      model:           'llama-3.3-70b-versatile',
      temperature:     0.7,
      max_tokens:      600,
      response_format: { type: 'json_object' },
      messages:        [{ role: 'user', content: prompt }],
    });

    const text = completion.choices?.[0]?.message?.content;
    if (!text) throw new Error('Empty response from AI');

    let raw = JSON.parse(text);

    // Server-side duplicate intent detection — regenerate once if duplicate found
    if (previousQuestions.length > 0) {
      const previousIntents = previousQuestions.map(q => q.questionIntent?.toLowerCase() || '');
      const newIntent = (raw.questionIntent || raw.question_intent || '').toLowerCase();
      const firstWord = newIntent.split(' ')[0];
      const isDuplicate = previousIntents.some(intent =>
        intent === newIntent ||
        (firstWord.length > 3 && (intent.includes(firstWord) || newIntent.includes(intent.split(' ')[0])))
      );
      if (isDuplicate) {
        console.warn('[Career Map] Duplicate question intent detected, regenerating:', newIntent);
        const extraNote = `CRITICAL: You already asked about "${newIntent}". You MUST choose a completely different topic from the remaining intents list.`;
        const retryPrompt = mode === 'skills'
          ? buildSkillsPrompt(selectedSkills, previousQuestions, questionNumber, extraNote)
          : buildPrompt(extractedProfile, previousQuestions, questionNumber, extraNote);
        const retry = await groq.chat.completions.create({
          model:           'llama-3.3-70b-versatile',
          temperature:     0.9,
          max_tokens:      600,
          response_format: { type: 'json_object' },
          messages:        [{ role: 'user', content: retryPrompt }],
        });
        const retryText = retry.choices?.[0]?.message?.content;
        if (retryText) raw = JSON.parse(retryText);
      }
    }

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

    // Enforce minimums: skills mode requires 3 questions, resume mode requires 5
    const minQuestions = mode === 'skills' ? 3 : 5;
    const effectiveContinue = questionNumber < minQuestions ? true : shouldContinue;

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

function buildPrompt(profile, previousQuestions, questionNumber, extraInstruction = '') {
  const prevText = previousQuestions.length === 0
    ? 'None yet — this is the first question.'
    : previousQuestions.map(q =>
        `Q${q.questionNumber} [${q.questionIntent}]: "${q.questionText}"\nAnswer: "${q.answerLabel || q.answerValue}"`
      ).join('\n\n');

  const coveredIntents = previousQuestions.length > 0
    ? previousQuestions.map(q => q.questionIntent).filter(Boolean).join(', ')
    : 'none';

  const minRemaining = Math.max(0, 5 - questionNumber + 1);
  const maxRemaining = 10 - questionNumber + 1;

  return `You are an adaptive career advisor conducting a personalised career assessment.

Your goal is to understand this professional's career goals, preferences, and constraints well enough to recommend the most relevant career paths for them.

Candidate profile (from their resume):
${JSON.stringify(profile, null, 2)}

Questions asked so far and their answers:
${prevText}

Topics already covered — DO NOT ask about any of these again:
${coveredIntents}

${extraInstruction ? `⚠️  ${extraInstruction}\n` : ''}You need to generate question number ${questionNumber}.

Rules for question generation:
1. Each question must reveal something NEW that you don't already know from the resume or previous answers
2. STRICTLY DO NOT repeat any intent from the "Topics already covered" list above — if you find yourself writing a similar question, choose a completely different topic instead
3. Your questionIntent field MUST NOT match or overlap with any intent already listed above
4. Make questions specific to this person — reference their actual job titles, skills, or industries
5. Alternate between preference questions (options) and exploratory questions (free text)
6. Options questions: provide exactly 4 options that are meaningfully different, not just variations
7. Free text questions: ask open-ended questions about aspirations, values, or context
8. Questions must be conversational, not bureaucratic — avoid corporate jargon
9. After question 5, evaluate if you have enough signal to make confident recommendations

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

function buildSkillsPrompt(selectedSkills, previousQuestions, questionNumber, extraInstruction = '') {
  const prevText = previousQuestions.length === 0
    ? 'None yet — this is the first question.'
    : previousQuestions.map(q =>
        `Q${q.questionNumber} [${q.questionIntent}]: "${q.questionText}"\nAnswer: "${q.answerLabel || q.answerValue}"`
      ).join('\n\n');

  const coveredIntents = previousQuestions.length > 0
    ? previousQuestions.map(q => q.questionIntent).filter(Boolean).join(', ')
    : 'none';

  const minRemaining = Math.max(0, 3 - questionNumber + 1);
  const maxRemaining = 7 - questionNumber + 1;

  return `You are a friendly course advisor personalising a study plan for someone who wants to learn specific skills.

Skills they want to learn: ${selectedSkills.join(', ')}

Questions asked so far and their answers:
${prevText}

Topics already covered — DO NOT ask about any of these again:
${coveredIntents}

${extraInstruction ? `⚠️  ${extraInstruction}\n` : ''}You need to generate question number ${questionNumber}.

Rules for question generation:
1. Each question must reveal something NEW about their learning context
2. STRICTLY DO NOT repeat any intent from the "Topics already covered" list above
3. Your questionIntent field MUST NOT match or overlap with any intent already listed above
4. Make questions specific to their chosen skills (${selectedSkills.join(', ')})
5. Alternate between preference questions (options) and exploratory questions (free text)
6. Options questions: provide exactly 4 meaningfully different options
7. Questions must be conversational and encouraging, not corporate jargon

Question intents to cover (pick the most relevant ones based on what's missing):
- Prior experience level (how much they already know about these skills)
- Learning goal (get a job, build a project, freelance, personal growth, certification)
- Timeline and urgency (how soon they want to be proficient)
- Biggest challenge or blocker they anticipate
- Specific area of focus within the skill set (if multiple skills)
- Preferred way to practise (build projects, follow exercises, work on existing codebase)

Current confidence assessment:
- Low (< 0.5): Ask more to understand their context
- Medium (0.5–0.84): Getting clearer, 1–2 more questions useful
- High (>= 0.85): Enough to personalise the course — consider stopping

${questionNumber >= 3
  ? `You have asked ${questionNumber - 1} questions. Evaluate your confidence honestly.
If you have strong signal on experience level, goals, and timeline → set shouldContinue: false.
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
shouldContinue must be false only if confidenceAfter >= 0.85 AND questionNumber >= 3, OR questionNumber = 7.
stopReason: "confident" if stopping due to confidence, "max_questions" if at limit, null otherwise.`;
}

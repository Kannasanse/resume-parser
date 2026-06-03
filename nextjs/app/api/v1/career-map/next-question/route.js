import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';
import { extractKnowledgeFromResume } from '@/lib/career-map/extractKnowledgeFromResume.js';

export const dynamic = 'force-dynamic';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const HARD_MAX_QUESTIONS = 10;
const EFFECTIVE_MAX      = 11; // safety net — never reached in normal flow
const TIER3_INTENTS      = ['salary_priority', 'geographic_constraint', 'risk_tolerance', 'industry_preference'];

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const {
      sessionId,
      extractedProfile,
      previousQuestions = [],
      questionNumber,
      mode = 'resume',
      selectedSkills = [],
    } = await request.json();

    // Verify session ownership
    const { data: session } = await supabase
      .from('career_map_sessions')
      .select('id, user_id')
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .single();
    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Server-side hard cap — force stop before even calling AI
    if (questionNumber > EFFECTIVE_MAX) {
      return NextResponse.json({
        question:        null,
        shouldContinue:  false,
        stopReason:      'max_questions',
        confidenceAfter: 0.75,
      });
    }

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
      const prevIntents = previousQuestions.map(q => (q.questionIntent || '').toLowerCase());
      const newIntent   = (raw.questionIntent || raw.question_intent || '').toLowerCase();
      const firstWord   = newIntent.split('_')[0];
      const isDuplicate = prevIntents.some(i =>
        i === newIntent || (firstWord.length > 3 && (i.includes(firstWord) || newIntent.includes(i.split('_')[0])))
      );
      if (isDuplicate) {
        console.warn('[Career Map] Duplicate intent detected, regenerating:', newIntent);
        const note = `CRITICAL: You already asked about "${newIntent}". Choose a completely different topic.`;
        const retryPrompt = mode === 'skills'
          ? buildSkillsPrompt(selectedSkills, previousQuestions, questionNumber, note)
          : buildPrompt(extractedProfile, previousQuestions, questionNumber, note);
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
      maxLength:      raw.maxLength      || raw.max_length
                      || (raw.questionType === 'free_text' ? 300 : null),
    };

    const confidenceAfter = Math.max(0, Math.min(1,
      parseFloat(raw.confidenceAfter ?? raw.confidence_after ?? 0)));
    let shouldContinue  = raw.shouldContinue ?? raw.should_continue ?? true;
    let stopReason      = raw.stopReason || raw.stop_reason || null;
    const continueReason = raw.continueReason || raw.continue_reason || null;

    // ── Server-side enforcement ──────────────────────────────────────────────

    // Enforce minimums
    const minQuestions = mode === 'skills' ? 3 : 5;
    if (questionNumber < minQuestions) shouldContinue = true;

    // Force stop if AI says continue but gives no reason (past minimum)
    if (shouldContinue && !continueReason && questionNumber >= minQuestions) {
      console.warn('[Questionnaire] AI said continue but gave no continueReason — forcing stop');
      shouldContinue = false;
      stopReason     = 'no_reason_given';
    }

    // Block Tier 3 questions at Q8+ (resume mode)
    if (shouldContinue && questionNumber >= 8 && mode === 'resume' && TIER3_INTENTS.includes(question.questionIntent)) {
      console.warn(`[Questionnaire] Blocking Tier 3 intent "${question.questionIntent}" at Q${questionNumber}`);
      shouldContinue = false;
      stopReason     = 'tier3_blocked';
    }

    // Absolute hard ceiling
    if (questionNumber >= HARD_MAX_QUESTIONS) {
      shouldContinue = false;
      stopReason     = stopReason || 'max_questions';
    }

    // Save question to DB (unanswered — answer saved by submit-answer)
    try {
      await supabase
        .from('career_map_questions')
        .upsert({
          session_id:       sessionId,
          question_number:  questionNumber,
          question_text:    question.questionText,
          question_type:    question.questionType,
          question_intent:  question.questionIntent,
          options:          question.options,
          confidence_after: confidenceAfter,
          should_continue:  shouldContinue,
        }, { onConflict: 'session_id,question_number' });
    } catch (_) {}

    return NextResponse.json({
      question,
      confidenceAfter,
      shouldContinue,
      stopReason: shouldContinue ? null : stopReason,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('next-question error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// ── Resume-mode prompt ───────────────────────────────────────────────────────

function buildPrompt(profile, previousQuestions, questionNumber, extraInstruction = '') {
  const knowledge = extractKnowledgeFromResume(profile);

  const knownLines = Object.entries(knowledge)
    .filter(([, v]) => v)
    .map(([k]) => `✓ ${k}`)
    .join('\n') || 'Nothing definitive yet';

  const unknownLines = Object.entries(knowledge)
    .filter(([, v]) => !v)
    .map(([k]) => `? ${k}`)
    .join('\n') || 'Nothing critical missing — you should stop';

  const coveredIntents = previousQuestions
    .map(q => q.questionIntent).filter(Boolean).join(', ') || 'none';

  const prevText = previousQuestions.length === 0
    ? 'None yet — this is Q1.'
    : previousQuestions.map(q =>
        `Q${q.questionNumber} [${q.questionIntent}]: "${q.questionText}"\n→ ${q.answerLabel || q.answerValue}`
      ).join('\n\n');

  const phaseBlock = questionNumber >= 8
    ? `⚠️ FINAL PHASE (Q${questionNumber}/10): You have ${HARD_MAX_QUESTIONS - questionNumber + 1} question(s) left.
Set shouldContinue: false UNLESS there is a CRITICAL Tier 1 gap remaining.
If in doubt → STOP. Do not ask nice-to-have questions.`
    : questionNumber >= 5
    ? `EVALUATION PHASE (Q${questionNumber}): Seriously consider stopping now.
Stop if you know: career_direction + timeline + at least one constraint.
Continue only if a genuine Tier 1 or Tier 2 gap exists — write it in continueReason.`
    : `ESSENTIAL PHASE (Q${questionNumber}): Ask only the most important unknown.`;

  return `You are a career advisor conducting a SHORT, FOCUSED career assessment.

HARD CONSTRAINTS:
1. STRICT budget of ${HARD_MAX_QUESTIONS} questions total — a hard ceiling, not a suggestion.
2. You are generating question ${questionNumber} of maximum ${HARD_MAX_QUESTIONS}.
3. ${phaseBlock}

CANDIDATE PROFILE (already known — DO NOT ask about these):
${JSON.stringify(profile, null, 2)}

WHAT THE RESUME ALREADY TELLS YOU:
${knownLines}

WHAT IS STILL UNKNOWN (potential question targets):
${unknownLines}

QUESTIONS AND ANSWERS SO FAR:
${prevText}

INTENT COVERAGE — do not re-ask any of these: ${coveredIntents}

${extraInstruction ? `⚠️ ${extraInstruction}\n` : ''}
AVAILABLE INTENTS — pick ONE most-critical unknown:

  TIER 1 — Critical (Q1–Q5 priority, ask if unknown):
    career_direction      — growth, transition, leadership, or exploration?
    target_role           — what specific role are they aiming for?
    timeline              — how soon do they want to make a move?

  TIER 2 — Important (Q4–Q7 only, ask if unknown AND questions remain):
    learning_commitment   — how many hours/week for upskilling?
    work_environment      — remote/hybrid/onsite + team size preference?
    blockers              — what's preventing the next move?

  TIER 3 — Nice to have (Q5–Q7 ONLY — NEVER ask at Q8+):
    salary_priority       — is comp a primary driver?
    geographic_constraint — open to relocation?
    risk_tolerance        — safe incremental vs ambitious leap?
    industry_preference   — specific sectors they want to move into?

DECISION RULES:
  • If ALL Tier 1 intents are covered → default to stopping
  • If career_direction + timeline are known → confidence is likely ≥ 0.85
  • If questionNumber ≥ 8 → stop unless a Tier 1 gap genuinely remains
  • NEVER ask Tier 3 at Q8+ — set shouldContinue: false instead

Return ONLY valid JSON — no prose outside the JSON:
{
  "questionText":    "specific to this person — reference their actual background",
  "questionType":    "options" | "free_text",
  "questionIntent":  "one intent name from the list above",
  "options": [
    { "id": "a", "label": "Display label", "value": "semantic_value" },
    { "id": "b", "label": "Display label", "value": "semantic_value" },
    { "id": "c", "label": "Display label", "value": "semantic_value" },
    { "id": "d", "label": "Display label", "value": "semantic_value" }
  ] | null,
  "placeholder":     "string for free_text" | null,
  "maxLength":       300 | null,
  "confidenceAfter": 0.0–1.0,
  "shouldContinue":  true | false,
  "stopReason":      "confident" | "max_questions" | null,
  "continueReason":  "one sentence: what critical gap still exists (required when shouldContinue=true)" | null
}

For free_text: set options=null, provide placeholder, maxLength=300.
For options: set placeholder=null, maxLength=null, provide exactly 4 options.
shouldContinue=false when confidenceAfter >= 0.85 AND questionNumber >= 5, OR questionNumber = ${HARD_MAX_QUESTIONS}.
continueReason is REQUIRED when shouldContinue=true — if you cannot write a genuine reason, set shouldContinue=false.`;
}

// ── Skills-mode prompt ───────────────────────────────────────────────────────

function buildSkillsPrompt(selectedSkills, previousQuestions, questionNumber, extraInstruction = '') {
  const coveredIntents = previousQuestions
    .map(q => q.questionIntent).filter(Boolean).join(', ') || 'none';

  const prevText = previousQuestions.length === 0
    ? 'None yet — this is Q1.'
    : previousQuestions.map(q =>
        `Q${q.questionNumber} [${q.questionIntent}]: "${q.questionText}"\n→ ${q.answerLabel || q.answerValue}`
      ).join('\n\n');

  const minSkills = 3;
  const maxSkills = 7;

  const phaseBlock = questionNumber >= 6
    ? `⚠️ FINAL PHASE: Only ${maxSkills - questionNumber + 1} question(s) left. Stop unless a critical learning gap remains.`
    : questionNumber >= 3
    ? `EVALUATION PHASE: Stop if you know experience level + goal + timeline. Continue only if a genuine gap exists.`
    : `ESSENTIAL PHASE: Ask the most important unknown about their learning context.`;

  return `You are a friendly course advisor personalising a study plan.

HARD CONSTRAINTS:
1. Maximum ${maxSkills} questions — hard ceiling.
2. You are generating question ${questionNumber} of maximum ${maxSkills}.
3. ${phaseBlock}

Skills they want to learn: ${selectedSkills.join(', ')}

QUESTIONS AND ANSWERS SO FAR:
${prevText}

INTENT COVERAGE — do not re-ask any of these: ${coveredIntents}

${extraInstruction ? `⚠️ ${extraInstruction}\n` : ''}
AVAILABLE INTENTS (pick ONE most-critical unknown):
  prior_experience      — how much they already know
  learning_goal         — get a job, build a project, freelance, or personal growth?
  timeline              — how soon do they want to be proficient?
  weekly_time           — hours per week available to study
  practice_preference   — build projects, follow tutorials, or work on a real codebase?
  focus_area            — specific sub-area within the skill set (if multiple skills)

Return ONLY valid JSON:
{
  "questionText":    "conversational, references their specific skills",
  "questionType":    "options" | "free_text",
  "questionIntent":  "one intent name above",
  "options": [
    { "id": "a", "label": "Display label", "value": "semantic_value" },
    { "id": "b", "label": "Display label", "value": "semantic_value" },
    { "id": "c", "label": "Display label", "value": "semantic_value" },
    { "id": "d", "label": "Display label", "value": "semantic_value" }
  ] | null,
  "placeholder":     "string for free_text" | null,
  "maxLength":       300 | null,
  "confidenceAfter": 0.0–1.0,
  "shouldContinue":  true | false,
  "stopReason":      "confident" | "max_questions" | null,
  "continueReason":  "one sentence reason to continue (required when shouldContinue=true)" | null
}

For free_text: options=null, provide placeholder, maxLength=300.
For options: placeholder=null, maxLength=null, exactly 4 options.
shouldContinue=false when confidenceAfter >= 0.85 AND questionNumber >= ${minSkills}, OR questionNumber = ${maxSkills}.
continueReason REQUIRED when shouldContinue=true.`;
}

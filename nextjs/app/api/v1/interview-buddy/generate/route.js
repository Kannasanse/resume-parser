import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';
import { callGemini } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

const DEPTH_COUNTS = { quick: '5-7', standard: '10-15', deep: '20-25' };
const LEVEL_LABELS = {
  entry: 'Entry-level', mid: 'Mid-level', senior: 'Senior',
  lead: 'Lead / Staff', exec: 'Executive / Director',
};

function buildPrompt(jobDescription, roleLevel, depth) {
  return `You are an expert interviewer and hiring coach. Analyse the following job description and generate a comprehensive interview question kit.

JOB DESCRIPTION:
${jobDescription}

ROLE LEVEL: ${LEVEL_LABELS[roleLevel] || 'Mid-level'}
DEPTH: ${depth} (quick = 5-7 Qs, standard = 10-15 Qs, deep = 20-25 Qs)

Your task:
1. Extract the 4-6 most important competency areas from this JD
2. For each area, generate 2-5 sharp, behaviour-based interview questions
3. For each question, write a coaching explanation of what a strong answer looks like — specifically calibrated to THIS role and JD

QUESTION QUALITY RULES:
- Every question must be behavioural or situational ("Tell me about a time...", "Walk me through...", "Give me an example of...")
- NO generic questions like "What is your greatest weakness?"
- Questions must reference specific responsibilities or skills from the JD
- Hard/probing follow-ups are encouraged

ANSWER EXPLANATION RULES:
- Start with "Strong answer:" followed by what specifically makes an answer good
- Include "Weak answer:" followed by what candidates typically say that fails
- Reference the specific role context from the JD
- 3-5 sentences total
- Do not write the answer itself — coach on what to say

CATEGORY NAMING:
- Name categories after the actual competency, not generic labels
- Examples: "Technical Architecture", "Stakeholder Management", "Data-Driven Decision Making", "Team Leadership", "Product Strategy"
- Avoid: "Soft Skills", "Hard Skills", "General", "Other"

OUTPUT — return ONLY valid JSON, no prose, no markdown:
{
  "title": "Role title extracted from JD",
  "company": "Company name if present, else empty string",
  "categories": ["Category 1", "Category 2"],
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "category": "Category name (must match one in categories array)",
      "question": "Full question text",
      "difficulty": "core",
      "answerGuide": "Strong answer: ... Weak answer: ...",
      "followUps": ["Optional follow-up 1"],
      "jdSignal": "The specific JD phrase or requirement this tests"
    }
  ]
}

difficulty values: "core" | "probing" | "red-flag"
Total questions must be in range: ${DEPTH_COUNTS[depth] || '10-15'} questions`;
}

async function callAI(prompt) {
  return callGemini(prompt, { system: 'You are an expert interviewer and hiring coach. Return ONLY valid JSON.', json: true, temperature: 0.7 });
}

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { jobDescription, roleLevel = 'mid', depth = 'standard' } = await request.json();

    if (!jobDescription?.trim() || jobDescription.trim().length < 100) {
      return Response.json({ error: 'Job description must be at least 100 characters.' }, { status: 400 });
    }
    if (!['quick', 'standard', 'deep'].includes(depth)) {
      return Response.json({ error: 'Invalid depth.' }, { status: 400 });
    }

    const prompt = buildPrompt(jobDescription.trim(), roleLevel, depth);
    const ai = await callAI(prompt);

    if (!ai?.questions?.length) {
      return Response.json({ error: 'AI generation failed — please try again.' }, { status: 502 });
    }

    // Normalise questions: ensure required fields
    const questions = ai.questions.map((q, i) => ({
      id:          q.id || `q${i + 1}`,
      number:      q.number || i + 1,
      category:    q.category || (ai.categories?.[0] || 'General'),
      question:    q.question || '',
      difficulty:  ['core', 'probing', 'red-flag'].includes(q.difficulty) ? q.difficulty : 'core',
      answerGuide: q.answerGuide || '',
      followUps:   Array.isArray(q.followUps) ? q.followUps : [],
      jdSignal:    q.jdSignal || '',
    }));

    const { data: kit, error } = await supabase
      .from('interview_kits')
      .insert({
        user_id:        user.id,
        title:          ai.title || 'Interview Kit',
        company:        ai.company || null,
        role_level:     roleLevel,
        depth,
        jd_text:        jobDescription.trim(),
        categories:     ai.categories || [],
        questions,
        question_count: questions.length,
      })
      .select()
      .single();

    if (error) throw error;

    return Response.json({ kit }, { status: 201 });
  } catch (err) {
    console.error('[interview-buddy/generate]', err);
    return Response.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

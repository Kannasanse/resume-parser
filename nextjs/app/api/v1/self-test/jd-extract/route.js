import { requireUser } from '@/lib/auth-helpers.js';
import { callGemini } from '@/lib/gemini';

export const dynamic = 'force-dynamic';

const SYSTEM_PROMPT = `You are an expert HR analyst. Extract all skills from the provided job description.

For each skill determine:
- name: concise skill name (e.g. "Python", "Team Leadership", "SQL", "Agile")
- type: "Hard" (technical, domain-specific, tool-based) or "Soft" (interpersonal, behavioral)
- confidence: "High" (explicitly required or mentioned 2+ times), "Medium" (mentioned once as required), "Low" (implied or preferred but not stated as required)

Rules:
- Extract 5–20 skills total
- Focus on concrete, testable skills
- Skip vague filler phrases ("passionate", "detail-oriented", "team player")
- Return ONLY valid JSON — no prose, no markdown fences

Return this exact structure:
{
  "skills": [
    {"name": "Python", "type": "Hard", "confidence": "High"},
    {"name": "Communication", "type": "Soft", "confidence": "Medium"}
  ]
}`;

function stripMarkup(text) {
  let s = text.replace(/<[^>]*>/g, ' ');
  s = s.replace(/#{1,6}\s/g, '');
  s = s.replace(/\*\*([^*]+)\*\*/g, '$1');
  s = s.replace(/\*([^*]+)\*/g, '$1');
  s = s.replace(/^[-*+]\s/gm, '');
  return s.replace(/\s+/g, ' ').trim();
}

function validateSkills(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(s => s?.name?.trim() && ['Hard', 'Soft'].includes(s.type) && ['High', 'Medium', 'Low'].includes(s.confidence))
    .map(s => ({ name: s.name.trim(), type: s.type, confidence: s.confidence }))
    .slice(0, 20);
}

async function callExtract(jdText) {
  const result = await callGemini(`Extract skills from this job description:\n\n${jdText}`, { system: SYSTEM_PROMPT, json: true, temperature: 0.7 });
  return validateSkills(result?.skills);
}

export async function POST(request) {
  try {
    await requireUser(request);
    const { jd_text } = await request.json();

    if (!jd_text?.trim()) {
      return Response.json({ error: 'Job description text is required.' }, { status: 400 });
    }

    const cleaned = stripMarkup(jd_text);
    if (cleaned.length < 100) {
      return Response.json(
        { error: 'Job description is too short. Please provide more detail (minimum 100 characters).' },
        { status: 400 },
      );
    }

    const skills = await callExtract(cleaned.slice(0, 8000));

    if (!skills.length) {
      return Response.json(
        { error: 'Unable to extract skills from this job description. Please check the content and try again.' },
        { status: 422 },
      );
    }

    return Response.json({ skills });
  } catch (err) {
    if (err instanceof Response) return err;
    if (err.message === 'timeout') {
      return Response.json({ error: 'Skill extraction timed out. Please try again.' }, { status: 408 });
    }
    return Response.json({ error: err.message }, { status: 500 });
  }
}

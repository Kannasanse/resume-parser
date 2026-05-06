import { requireUser } from '@/lib/auth-helpers.js';

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
  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: `Extract skills from this job description:\n\n${jdText}` },
  ];

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
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
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
        signal: controller.signal,
      });
      if (resp.ok) {
        const data = await resp.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) {
          const valid = validateSkills(JSON.parse(text)?.skills);
          if (valid.length) return valid;
        }
      }
    } catch (e) {
      if (e.name === 'AbortError') throw new Error('timeout');
    }

    // Groq fallback
    const { Groq } = await import('groq-sdk');
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });
    const text = completion.choices?.[0]?.message?.content;
    if (!text) return [];
    return validateSkills(JSON.parse(text)?.skills);
  } finally {
    clearTimeout(timeout);
  }
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

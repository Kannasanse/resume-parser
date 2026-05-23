import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';

export async function POST(req) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const { currentSkills, projectKeywords, targetRole, yearsExperience } = await req.json();
  if (!targetRole) return NextResponse.json({ error: 'targetRole is required' }, { status: 400 });

  const prompt = `You are a career advisor reviewing a professional's skills for a target role.

Current skills: ${(currentSkills || []).join(', ')}
Project experience keywords: ${(projectKeywords || []).join(', ')}
Target role: ${targetRole}
Years of experience: ${yearsExperience || 'not specified'}

Identify the top 5-8 skills that are commonly expected for "${targetRole}" that are NOT in their current skills list. Prioritise high-impact, frequently required skills.

Return ONLY a JSON object with this structure:
{
  "missingSkills": [
    { "skill": "skill name", "importance": "high|medium", "reason": "one sentence why this matters for the target role" }
  ],
  "summary": "One sentence overall assessment"
}
No preamble, no explanation outside the JSON.`;

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 600,
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  let result;
  try {
    result = JSON.parse(data.choices?.[0]?.message?.content ?? '');
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }
  return NextResponse.json(result);
}

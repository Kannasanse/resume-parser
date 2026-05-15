import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { callClaude, checkAiUsage, recordAiUsage } from '@/lib/aiHelpers.js';

const FREE_LIMIT = 5;

export async function POST(req) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

  const usage = await checkAiUsage(user.id, supabase);
  if (usage >= FREE_LIMIT) {
    return NextResponse.json({ error: 'limit_reached', message: "You've used all 5 AI generations this month." }, { status: 402 });
  }

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

  const raw = await callClaude(prompt, 600);
  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }
  await recordAiUsage(user.id, 'skills-gap', supabase);
  return NextResponse.json(result);
}

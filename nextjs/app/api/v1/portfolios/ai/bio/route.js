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

  const { name, headline, jobTitles, topSkills, yearsExperience, availability, targetRole } = await req.json();

  const prompt = `You are a professional bio writer. Write a concise, engaging About section for a portfolio website.

Person details:
- Name: ${name}
- Current headline: ${headline}
- Recent roles: ${(jobTitles || []).join(', ')}
- Top skills: ${(topSkills || []).join(', ')}
- Years of experience: ${yearsExperience || 'not specified'}
- Availability: ${availability || 'not specified'}
- Target role (if specified): ${targetRole || 'not specified'}

Write 2-4 sentences in first person. Be specific and results-oriented. Avoid clichés like "passionate" or "enthusiastic". Focus on what makes this person distinctive. Return ONLY the bio text, no preamble.`;

  const text = await callClaude(prompt, 300);
  await recordAiUsage(user.id, 'bio', supabase);
  return NextResponse.json({ text });
}

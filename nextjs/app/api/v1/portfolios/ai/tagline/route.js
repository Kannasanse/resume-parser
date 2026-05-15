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

  const { name, jobTitle, topSkills, targetRole, tone } = await req.json();

  const prompt = `Generate 5 distinct headline/tagline options for a portfolio website.

Person: ${name}
Current role: ${jobTitle}
Key skills: ${(topSkills || []).join(', ')}
Target role: ${targetRole || 'not specified'}
Tone: ${tone || 'professional'}

Requirements:
- Each tagline: 5-12 words maximum
- No buzzwords like "passionate", "innovative", "guru", "ninja"
- Each option should take a different angle (e.g. role-focused, skills-focused, impact-focused, personality-driven, future-focused)
- Tone must match: ${tone || 'professional'}

Return ONLY a JSON array of 5 strings. No explanation, no numbering, no preamble.
Example format: ["Tagline one", "Tagline two", "Tagline three", "Tagline four", "Tagline five"]`;

  const raw = await callClaude(prompt, 300);
  let taglines;
  try {
    taglines = JSON.parse(raw);
  } catch {
    taglines = raw.split('\n').filter(l => l.trim()).slice(0, 5);
  }
  await recordAiUsage(user.id, 'tagline', supabase);
  return NextResponse.json({ taglines });
}

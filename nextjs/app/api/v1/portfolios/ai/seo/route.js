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

  const { portfolioName, ownerName, headline, topSkills, projectTitles } = await req.json();

  const prompt = `Write an SEO-optimised meta title and meta description for a professional portfolio website.

Owner: ${ownerName}
Headline: ${headline}
Top skills: ${(topSkills || []).join(', ')}
Notable projects: ${(projectTitles || []).join(', ')}

Requirements:
- Meta title: 50-60 characters. Include the person's name and primary role/skill. No generic phrases like "Welcome to my portfolio".
- Meta description: 140-160 characters. Mention 2-3 key skills or achievements. Include a subtle call to action. No keyword stuffing.

Return ONLY a JSON object:
{ "metaTitle": "...", "metaDescription": "..." }
No preamble.`;

  const raw = await callClaude(prompt, 300);
  let result;
  try {
    result = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
  }
  await recordAiUsage(user.id, 'seo', supabase);
  return NextResponse.json(result);
}

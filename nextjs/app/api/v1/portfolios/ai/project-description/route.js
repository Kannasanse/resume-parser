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

  const { title, category, techStack, myRole, draftText, outcomes } = await req.json();

  if (!draftText || draftText.length < 20) {
    return NextResponse.json({ error: 'Please write at least a few sentences first. AI will enhance what you have.' }, { status: 400 });
  }

  const outcomesStr = (outcomes || []).map(o => `${o.metric}: ${o.value}`).join(', ') || 'none provided';

  const prompt = `You are a professional portfolio writer helping a ${myRole || 'professional'} improve their project description.

Project: ${title}
Category: ${category || 'not specified'}
Tech stack: ${(techStack || []).join(', ')}
Role: ${myRole || 'not specified'}
Existing outcomes/metrics: ${outcomesStr}

Original description:
${draftText}

Rewrite this project description to be:
1. Results and impact focused (use the metrics if available, suggest placeholders like [X%] if not)
2. Action-verb led (built, designed, reduced, increased, automated)
3. Specific about the problem solved and the solution
4. 3-5 sentences maximum
5. Written in past tense

Return ONLY the improved description as plain text. No markdown, no bullet points, no preamble.`;

  const text = await callClaude(prompt, 400);
  await recordAiUsage(user.id, 'project', supabase);
  return NextResponse.json({ text });
}

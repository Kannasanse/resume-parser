import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';

export async function POST(req) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

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

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'meta-llama/llama-3.3-70b-instruct:free',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 300,
    }),
  });
  if (!res.ok) throw new Error(`OpenRouter ${res.status}`);
  const data = await res.json();
  const text = data.choices?.[0]?.message?.content ?? '';
  return NextResponse.json({ text });
}

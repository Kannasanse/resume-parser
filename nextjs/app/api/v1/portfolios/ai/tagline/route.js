import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';

export async function POST(req) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

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
  const raw = data.choices?.[0]?.message?.content ?? '';
  let taglines;
  try {
    taglines = JSON.parse(raw);
  } catch {
    taglines = raw.split('\n').filter(l => l.trim()).slice(0, 5);
  }
  return NextResponse.json({ taglines });
}

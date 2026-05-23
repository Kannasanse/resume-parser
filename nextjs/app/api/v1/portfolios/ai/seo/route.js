import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';

export async function POST(req) {
  const user = await requireUser(req);
  if (user instanceof NextResponse) return user;

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

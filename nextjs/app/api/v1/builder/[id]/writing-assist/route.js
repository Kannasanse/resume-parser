import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM_PROMPTS = {
  summary: `You are an expert resume writer specialising in professional summaries.
Improve the provided resume summary to be compelling, concise (3–4 sentences), and ATS-optimised.
Use strong professional language. Highlight the candidate's value proposition.
Return ONLY the improved content as clean HTML using <p> tags. No explanation, no markdown, no commentary.`,

  work_experience: `You are an expert resume writer specialising in work experience bullet points.
Improve the provided job description bullets using:
- Strong action verbs (Led, Built, Increased, Reduced, Delivered, Architected…)
- Quantifiable achievements where possible (numbers, percentages, scale)
- STAR format (Situation/Task → Action → Result) where applicable
- Concise, impactful language — no filler words
Return ONLY the improved content as a clean HTML <ul> list with <li><p>…</p></li> items. No explanation, no markdown.`,

  education: `You are an expert resume writer.
Improve the provided education description to highlight academic achievements, relevant coursework, honours, or activities.
Keep it concise and professional.
Return ONLY the improved content as clean HTML using <p> tags or a <ul> list. No explanation, no markdown.`,

  project: `You are an expert resume writer specialising in project descriptions.
Improve the provided project description to clearly communicate:
- What was built and why
- Technologies used and your specific role
- Impact or outcome (users, performance, scale)
Use strong action verbs and concise bullet points.
Return ONLY the improved content as a clean HTML <ul> list with <li><p>…</p></li> items. No explanation, no markdown.`,

  custom: `You are an expert resume writer.
Improve the provided resume section content to be more impactful, professional, and ATS-optimised.
Return ONLY the improved content as clean HTML. No explanation, no markdown.`,
};

function stripHtml(html) {
  return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

export async function POST(req, { params }) {
  try {
    await requireUser(req);
  } catch (e) { return e; }

  const body = await req.json().catch(() => null);
  const { content, sectionType, context = {} } = body || {};

  if (!content || !sectionType) {
    return NextResponse.json({ error: 'content and sectionType required' }, { status: 400 });
  }

  const plainText = stripHtml(content);
  if (plainText.length < 10) {
    return NextResponse.json({ error: 'Content is too short to improve. Add some text first.' }, { status: 400 });
  }

  const systemPrompt = SYSTEM_PROMPTS[sectionType] || SYSTEM_PROMPTS.custom;

  // Build context string for the user message
  const contextLines = [];
  if (context.jobTitle)  contextLines.push(`Job title: ${context.jobTitle}`);
  if (context.employer)  contextLines.push(`Employer: ${context.employer}`);
  if (context.school)    contextLines.push(`School: ${context.school}`);
  if (context.degree)    contextLines.push(`Degree: ${context.degree}`);
  if (context.project)   contextLines.push(`Project: ${context.project}`);
  if (context.role)      contextLines.push(`Role / tech: ${context.role}`);

  const userMessage = contextLines.length
    ? `${contextLines.join('\n')}\n\nCurrent content:\n${plainText}`
    : `Current content:\n${plainText}`;

  try {
    const completion = await groq.chat.completions.create({
      model: 'meta-llama/llama-4-scout-17b-16e-instruct',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user',   content: userMessage },
      ],
      max_tokens: 800,
      temperature: 0.4,
    });

    let improved = completion.choices?.[0]?.message?.content?.trim() || '';

    // Strip any markdown code fences the model may have added
    improved = improved.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();

    // Ensure it contains some HTML — if the model returned plain text, wrap it
    if (!improved.includes('<')) {
      improved = `<p>${improved.replace(/\n+/g, '</p><p>')}</p>`;
    }

    return NextResponse.json({ improved });
  } catch (err) {
    console.error('[writing-assist] Groq error:', err.message);

    // Fallback to OpenRouter
    try {
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'HTTP-Referer': 'https://proflect.app',
        },
        body: JSON.stringify({
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userMessage },
          ],
          max_tokens: 800,
          temperature: 0.4,
        }),
      });
      const data = await res.json();
      let improved = data.choices?.[0]?.message?.content?.trim() || '';
      improved = improved.replace(/^```html?\s*/i, '').replace(/```\s*$/i, '').trim();
      if (!improved.includes('<')) {
        improved = `<p>${improved.replace(/\n+/g, '</p><p>')}</p>`;
      }
      return NextResponse.json({ improved });
    } catch (fallbackErr) {
      console.error('[writing-assist] fallback error:', fallbackErr.message);
      return NextResponse.json({ error: 'AI service unavailable. Please try again.' }, { status: 503 });
    }
  }
}

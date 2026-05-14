import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Groq from 'groq-sdk';
import { deductCredits, getBalance } from '@/lib/credits.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function resumeToText(resume) {
  const lines = [];
  const pi = resume.personal_info || {};

  if (pi.name)     lines.push(`Name: ${pi.name}`);
  if (pi.title)    lines.push(`Title: ${pi.title}`);
  if (pi.email)    lines.push(`Email: ${pi.email}`);
  if (pi.phone)    lines.push(`Phone: ${pi.phone}`);
  if (pi.location) lines.push(`Location: ${pi.location}`);
  if (pi.linkedin) lines.push(`LinkedIn: ${pi.linkedin}`);
  lines.push('');

  for (const sec of resume.sections || []) {
    if (!sec.enabled) continue;
    lines.push(`=== ${sec.title} ===`);
    const c = sec.content || {};

    if (sec.type === 'summary') {
      lines.push(c.text?.replace(/<[^>]+>/g, '') || '');

    } else if (sec.type === 'work_experience') {
      for (const e of c.entries || []) {
        lines.push(`${e.title} at ${e.employer} (${e.dates}) ${e.location || ''}`);
        if (e.body) lines.push(e.body.replace(/<[^>]+>/g, ''));
        for (const b of e.bullets || []) lines.push(`• ${b}`);
      }

    } else if (sec.type === 'education') {
      for (const e of c.entries || []) {
        lines.push(`${e.degree} — ${e.school} (${e.dates})`);
        if (e.body) lines.push(e.body.replace(/<[^>]+>/g, ''));
      }

    } else if (sec.type === 'skills') {
      for (const e of c.entries || []) {
        const subs = (e.subSkills || []).filter(Boolean);
        lines.push(`${e.name}${subs.length ? ': ' + subs.join(', ') : ''}`);
      }

    } else if (sec.type === 'projects') {
      for (const e of c.entries || []) {
        lines.push(`${e.title} (${e.dates || ''})`);
        if (e.body) lines.push(e.body.replace(/<[^>]+>/g, ''));
        if (e.description) lines.push(e.description);
      }

    } else if (sec.type === 'certifications') {
      for (const e of c.entries || []) lines.push(`${e.name} — ${e.issuer || ''} (${e.date || ''})`);

    } else if (sec.type === 'languages') {
      for (const e of c.entries || []) lines.push(`${e.name}: ${e.level || ''}`);

    } else if (c.text) {
      lines.push(c.text.replace(/<[^>]+>/g, ''));
    }

    lines.push('');
  }

  return lines.join('\n').trim();
}

const SYSTEM_PROMPT = `You are an expert ATS (Applicant Tracking System) and resume coach. Analyze the provided resume and return a detailed ATS evaluation as valid JSON only — no markdown, no explanation outside the JSON.

Return exactly this structure:
{
  "score": <integer 0-100>,
  "band": <"Excellent"|"Good"|"Fair"|"Poor">,
  "summary": "<2-3 sentence overall assessment>",
  "categories": [
    { "name": "Keywords & Skills", "score": <0-100>, "icon": "keywords", "feedback": "<specific feedback>" },
    { "name": "Work Experience", "score": <0-100>, "icon": "experience", "feedback": "<specific feedback>" },
    { "name": "Education", "score": <0-100>, "icon": "education", "feedback": "<specific feedback>" },
    { "name": "Formatting & Structure", "score": <0-100>, "icon": "formatting", "feedback": "<specific feedback>" },
    { "name": "Quantified Achievements", "score": <0-100>, "icon": "achievements", "feedback": "<specific feedback>" },
    { "name": "Contact & Completeness", "score": <0-100>, "icon": "contact", "feedback": "<specific feedback>" }
  ],
  "strengths": ["<specific strength 1>", "<specific strength 2>", "<specific strength 3>"],
  "improvements": [
    { "priority": "high", "title": "<short title>", "detail": "<actionable recommendation>" },
    { "priority": "high", "title": "<short title>", "detail": "<actionable recommendation>" },
    { "priority": "medium", "title": "<short title>", "detail": "<actionable recommendation>" },
    { "priority": "medium", "title": "<short title>", "detail": "<actionable recommendation>" },
    { "priority": "low", "title": "<short title>", "detail": "<actionable recommendation>" }
  ],
  "keywords": {
    "found": ["<keyword1>", "<keyword2>", "<keyword3>"],
    "missing": ["<suggested keyword1>", "<suggested keyword2>", "<suggested keyword3>"]
  }
}`;

export async function POST(request, { params }) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    // Credit guard
    const balance = await getBalance(user.id);
    if (balance < 3) {
      return NextResponse.json({ error: 'Insufficient credits. ATS analysis costs 3 credits.', code: 'insufficient_credits', balance }, { status: 402 });
    }

    const { id } = await params;

    const { data: resume } = await supabase
      .from('builder_resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

    // Also fetch sections
    const { data: sections } = await supabase
      .from('builder_sections')
      .select('*')
      .eq('resume_id', id)
      .order('position');

    const fullResume = { ...resume, sections: sections || [] };
    const resumeText = resumeToText(fullResume);

    const tryParse = (text) => {
      try {
        const m = text.match(/\{[\s\S]*\}/);
        return m ? JSON.parse(m[0]) : null;
      } catch { return null; }
    };

    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: `Analyze this resume:\n\n${resumeText}` },
    ];

    let result = null;

    // Try Groq first
    try {
      const res = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages,
        max_tokens: 1200,
        temperature: 0.2,
      });
      result = tryParse(res.choices?.[0]?.message?.content || '');
    } catch (err) {
      console.warn('[ats-score] Groq failed:', err.message);
    }

    // Fallback to OpenRouter
    if (!result && process.env.OPENROUTER_API_KEY) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: { Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ model: 'meta-llama/llama-3.3-70b-instruct:free', messages, max_tokens: 1200, temperature: 0.2 }),
        });
        if (res.ok) result = tryParse((await res.json()).choices?.[0]?.message?.content || '');
      } catch (err) {
        console.warn('[ats-score] OpenRouter failed:', err.message);
      }
    }

    if (!result) return NextResponse.json({ error: 'AI analysis failed. Please try again.' }, { status: 502 });

    // Deduct credits after successful analysis
    const { ok, balance: newBalance } = await deductCredits(user.id, 'ats_score');
    if (!ok) return NextResponse.json({ error: 'Insufficient credits.', code: 'insufficient_credits', balance: 0 }, { status: 402 });

    return NextResponse.json({ ...result, credits_used: 3, credits_remaining: newBalance });
  } catch (err) {
    console.error('[ats-score]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { deductCredits, getBalance } from '@/lib/credits.js';
import { callGemini } from '@/lib/gemini';

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

function countWords(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function buildSystemPrompt(mode, jobDescription) {
  const modeInstructions = mode === 'targeted'
    ? `MODE: Targeted — you have a job description to use as the benchmark. Extract required skills, preferred skills, job title, and key role keywords from the JD and score the resume against them.`
    : `MODE: Default — no job description provided. Infer the candidate's target role from their job titles, skills, and summary. Use that role's ATS best practices as the benchmark. If you cannot detect a role with sufficient confidence (below ~60%), use general ATS best practices and set detectedRole to "General".`;

  return `You are an expert ATS (Applicant Tracking System) evaluator and resume coach.

${modeInstructions}

Analyze the resume and return a structured ATS evaluation as valid JSON only — no markdown, no explanation outside the JSON.

Score across exactly five dimensions:
1. Section Completeness (weight: 20%) — Check for Contact Info, Work Experience, Education, Skills, Professional Summary. Deduct for missing fields within Contact Info (name, email, phone, location, LinkedIn). Bonus for Certifications, Projects, Languages, Volunteering (up to ceiling, no penalty if absent).
2. Keyword & Skills Match (weight: 25%) — In Default mode: match against inferred role keyword library. In Targeted mode: match against JD keywords/skills. Exact matches > stem matches. Flag keyword stuffing (same keyword >5 times). Recognize synonyms (MS Excel = Microsoft Excel, JS = JavaScript, etc.).
3. Content Quality (weight: 25%) — Evaluate bullets for accomplishment-orientation vs duty-only. Reward measurable results (numbers, %, $, time, scale). Check Professional Summary completeness. Flag personal pronouns (I, my, we) and passive voice. Check each Work Experience entry for company, title, dates, location, minimum 2 bullets.
4. Formatting & Parseability (weight: 20%) — Check for ATS-hostile elements: tables for layout, text boxes, multi-column critical content, headers/footers with contact details, embedded image text, non-standard fonts. Verify consistent date formats. Check section heading standardness. Check resume length appropriateness (1 page <5 yrs exp, up to 2 pages for 5+ yrs).
5. Measurable Impact (weight: 10%) — Calculate % of Work Experience bullets with quantifiable results. 70%+ = 100 score; 40-69% = 50 score; <40% = 0 score.

Overall score = weighted average of the five dimension scores (already factoring in weights of 20/25/25/20/10).

Return EXACTLY this JSON structure:
{
  "score": <integer 0-100>,
  "band": <"Excellent"|"Good"|"Fair"|"Poor">,
  "mode": <"default"|"targeted">,
  "detectedRole": "<inferred role category or job title from JD, e.g. 'Software Engineer' or 'General'>",
  "scoringAgainst": "<'your resume\\'s job profile' or 'pasted job description'>",
  "summary": "<2-3 sentence overall assessment>",
  "dimensions": [
    { "name": "Section Completeness", "weight": 20, "score": <0-100>, "gap": "<one-line primary gap>" },
    { "name": "Keyword & Skills Match", "weight": 25, "score": <0-100>, "gap": "<one-line primary gap>" },
    { "name": "Content Quality", "weight": 25, "score": <0-100>, "gap": "<one-line primary gap>" },
    { "name": "Formatting & Parseability", "weight": 20, "score": <0-100>, "gap": "<one-line primary gap>" },
    { "name": "Measurable Impact", "weight": 10, "score": <0-100>, "gap": "<one-line primary gap>" }
  ],
  "keywords": {
    "found": ["<keyword1>", "<keyword2>", "<keyword3>"],
    "missing": ["<missing keyword1>", "<missing keyword2>", "<missing keyword3>"]
  },
  "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
  "improvements": [
    { "priority": "high", "section": "<affected section>", "issue": "<specific issue>", "fix": "<concrete fix>", "title": "<short title>", "detail": "<actionable recommendation>" },
    { "priority": "high", "section": "<affected section>", "issue": "<specific issue>", "fix": "<concrete fix>", "title": "<short title>", "detail": "<actionable recommendation>" },
    { "priority": "medium", "section": "<affected section>", "issue": "<specific issue>", "fix": "<concrete fix>", "title": "<short title>", "detail": "<actionable recommendation>" },
    { "priority": "medium", "section": "<affected section>", "issue": "<specific issue>", "fix": "<concrete fix>", "title": "<short title>", "detail": "<actionable recommendation>" },
    { "priority": "low", "section": "<affected section>", "issue": "<specific issue>", "fix": "<concrete fix>", "title": "<short title>", "detail": "<actionable recommendation>" }
  ]
}`;
}

export async function POST(request, { params }) {
  const timeoutMs = 10000;
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

    // Parse optional job description from body
    let jobDescription = '';
    try {
      const body = await request.json();
      jobDescription = (body?.jobDescription || '').trim();
    } catch { /* no body or non-JSON body is fine */ }

    // Validate JD if provided
    const jdWordCount = jobDescription ? countWords(jobDescription) : 0;
    if (jobDescription && jdWordCount < 50) {
      return NextResponse.json(
        { error: 'Your job description seems too short for accurate scoring. Please add more detail.', code: 'jd_too_short' },
        { status: 422 }
      );
    }

    const mode = jobDescription ? 'targeted' : 'default';

    const { data: resume } = await supabase
      .from('builder_resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!resume) return NextResponse.json({ error: 'Resume not found' }, { status: 404 });

    const { data: sections } = await supabase
      .from('builder_sections')
      .select('*')
      .eq('resume_id', id)
      .order('position');

    const fullResume = { ...resume, sections: sections || [] };
    const resumeText = resumeToText(fullResume);

    // Validate resume has enough content
    if (countWords(resumeText) < 30) {
      return NextResponse.json(
        { error: 'Your resume needs more content before we can generate an accurate ATS score.', code: 'resume_too_sparse' },
        { status: 422 }
      );
    }

    const tryParse = (text) => {
      try {
        const m = text.match(/\{[\s\S]*\}/);
        return m ? JSON.parse(m[0]) : null;
      } catch { return null; }
    };

    const userContent = mode === 'targeted'
      ? `Analyze this resume:\n\n${resumeText}\n\n---\nJOB DESCRIPTION:\n${jobDescription}`
      : `Analyze this resume:\n\n${resumeText}`;

    let result = null;

    try {
      const raw = await callGemini(userContent, { system: buildSystemPrompt(mode, jobDescription), json: true, temperature: 0.7 });
      result = raw;
    } catch (err) {
      console.warn('[ats-score] Gemini failed:', err.message);
    }

    if (!result) return NextResponse.json({ error: "We couldn't generate your score right now. Please try again in a moment.", code: 'scoring_failed' }, { status: 502 });

    // Deduct credits after successful analysis
    const { ok, balance: newBalance } = await deductCredits(user.id, 'ats_score');
    if (!ok) return NextResponse.json({ error: 'Insufficient credits.', code: 'insufficient_credits', balance: 0 }, { status: 402 });

    return NextResponse.json({ ...result, mode, credits_used: 3, credits_remaining: newBalance });
  } catch (err) {
    console.error('[ats-score]', err);
    return NextResponse.json({ error: "We couldn't generate your score right now. Please try again in a moment." }, { status: 500 });
  }
}

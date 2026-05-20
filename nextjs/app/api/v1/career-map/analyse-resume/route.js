import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt, maxTokens = 800) {
  const res = await groq.chat.completions.create({
    model: 'meta-llama/llama-4-scout-17b-16e-instruct',
    max_tokens: maxTokens,
    messages: [{ role: 'user', content: prompt }],
  });
  return res.choices?.[0]?.message?.content ?? '';
}

function flattenResumeToText(resume, sections) {
  const parts = [];

  const p = resume.personal_info || {};
  if (p.name) parts.push(`Name: ${p.name}`);
  if (p.title) parts.push(`Title: ${p.title}`);
  if (p.summary) parts.push(`Summary: ${p.summary}`);

  for (const section of sections || []) {
    const c = section.content || {};
    parts.push(`\n[${section.title || section.type}]`);

    if (section.type === 'experience' || section.type === 'work_experience') {
      for (const item of c.items || []) {
        parts.push(`${item.title || ''} at ${item.company || ''} (${item.startDate || ''} – ${item.endDate || item.current ? 'Present' : ''})`);
        if (item.description) parts.push(item.description);
        if (Array.isArray(item.bullets)) parts.push(item.bullets.join('\n'));
      }
    } else if (section.type === 'education') {
      for (const item of c.items || []) {
        parts.push(`${item.degree || ''} at ${item.institution || ''} (${item.year || ''})`);
      }
    } else if (section.type === 'skills') {
      if (Array.isArray(c.skills)) parts.push(c.skills.map(s => (typeof s === 'string' ? s : s.name || '')).join(', '));
      else if (Array.isArray(c.items)) parts.push(c.items.map(s => (typeof s === 'string' ? s : s.name || s.label || '')).join(', '));
      else if (typeof c.text === 'string') parts.push(c.text);
    } else if (section.type === 'certifications') {
      for (const item of c.items || []) {
        parts.push(`${item.name || ''} ${item.issuer ? `(${item.issuer})` : ''}`);
      }
    } else if (c.text) {
      parts.push(c.text);
    }
  }

  return parts.filter(Boolean).join('\n');
}

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { resume_id, builder_resume_id } = await request.json();

    let resumeText = '';
    let resolvedResumeId = null;

    if (builder_resume_id) {
      // Fetch from builder_resumes + builder_sections
      const { data: builderResume } = await supabase
        .from('builder_resumes')
        .select('id, title, template_id, personal_info')
        .eq('id', builder_resume_id)
        .eq('user_id', user.id)
        .single();

      if (builderResume) {
        const { data: sections } = await supabase
          .from('builder_sections')
          .select('type, title, content, position')
          .eq('resume_id', builder_resume_id)
          .order('position', { ascending: true });

        resumeText = flattenResumeToText(builderResume, sections || []);
        resolvedResumeId = builder_resume_id;
      }
    } else if (resume_id) {
      // Legacy: fetch from uploaded resumes table
      const { data: resume } = await supabase
        .from('resumes')
        .select('raw_text, parsed_data')
        .eq('id', resume_id)
        .eq('user_id', user.id)
        .single();
      if (resume) {
        resumeText = resume.raw_text || JSON.stringify(resume.parsed_data || {});
        resolvedResumeId = resume_id;
      }
    }

    const prompt = `Analyse this resume and extract structured data.

Resume content:
${resumeText || 'No resume provided — use placeholder data for a generic software engineer.'}

Extract and return ONLY a JSON object matching this schema:
{
  "currentTitle": "most recent job title",
  "currentSeniority": "Junior|Mid|Senior|Lead|Principal|Director",
  "currentDomain": "Engineering|Data|Design|Product|Management|Marketing|Finance|Operations|Other",
  "totalYearsExp": number,
  "skills": ["skill1", "skill2"],
  "industries": ["industry1"],
  "educationLevel": "Bachelor|Master|PhD|Bootcamp|Self-taught|Other",
  "topTechStack": ["tech1", "tech2"],
  "hasManagement": boolean,
  "hasLeadership": boolean,
  "certifications": ["cert1"]
}

Be conservative with seniority inference. If unclear, use the most common seniority for the title.
Return ONLY the JSON, no preamble.`;

    const raw = await callGroq(prompt, 800);
    let profile;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      profile = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      profile = {
        currentTitle: 'Unknown',
        currentSeniority: 'Mid',
        currentDomain: 'Engineering',
        totalYearsExp: 0,
        skills: [],
        industries: [],
        educationLevel: 'Bachelor',
        topTechStack: [],
        hasManagement: false,
        hasLeadership: false,
        certifications: [],
      };
    }

    const { data: session, error } = await supabase
      .from('career_map_sessions')
      .insert({
        user_id: user.id,
        resume_id: resolvedResumeId,
        extracted_profile: profile,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ session_id: session.id, profile });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('analyse-resume error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

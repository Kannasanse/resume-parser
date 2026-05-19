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

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { resume_id } = await request.json();

    let resumeText = '';
    if (resume_id) {
      const { data: resume } = await supabase
        .from('resumes')
        .select('raw_text, parsed_data')
        .eq('id', resume_id)
        .eq('user_id', user.id)
        .single();
      if (resume) {
        resumeText = resume.raw_text || JSON.stringify(resume.parsed_data || {});
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

    // Upsert session with extracted profile
    const { data: session, error } = await supabase
      .from('career_map_sessions')
      .insert({
        user_id: user.id,
        resume_id: resume_id || null,
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

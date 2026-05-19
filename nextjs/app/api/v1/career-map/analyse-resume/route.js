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

    const prompt = `You are a career intelligence assistant. Analyse the following resume and extract a structured professional profile.

Resume:
${resumeText || 'No resume provided — use placeholder data.'}

Return ONLY valid JSON (no markdown, no explanation) with this exact shape:
{
  "current_title": "string — most recent job title",
  "years_experience": number,
  "skills": ["array", "of", "skill", "strings"],
  "industries": ["array", "of", "industry", "strings"],
  "education_level": "High School | Bachelor's | Master's | PhD | Bootcamp | Self-taught",
  "summary": "2-3 sentence professional summary"
}`;

    const raw = await callGroq(prompt, 800);
    let profile;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      profile = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      profile = {
        current_title: 'Unknown',
        years_experience: 0,
        skills: [],
        industries: [],
        education_level: "Bachelor's",
        summary: 'Could not parse resume.',
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

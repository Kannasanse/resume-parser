import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt, maxTokens = 1500) {
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
    const { session_id, role_id } = await request.json();

    const { data: session } = await supabase
      .from('career_map_sessions')
      .select('extracted_profile')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    const { data: role } = await supabase
      .from('career_role_database')
      .select('title, required_skills, core_skills, avg_years_exp, description')
      .eq('id', role_id)
      .single();

    if (!role) return NextResponse.json({ error: 'Role not found' }, { status: 404 });

    const profile = session.extracted_profile;
    const userSkills = new Set((profile.skills || []).map(s => s.toLowerCase()));
    const missingSkills = (role.required_skills || []).filter(s => !userSkills.has(s.toLowerCase()));

    const prompt = `You are a career coach. Create a practical 3-6 month learning roadmap for a professional transitioning to a new role.

Current profile:
- Title: ${profile.current_title || 'Unknown'}
- Years experience: ${profile.years_experience || 0}
- Existing skills: ${(profile.skills || []).join(', ')}

Target role: ${role.title}
Missing skills to acquire: ${missingSkills.join(', ')}
Core skills for the role: ${(role.core_skills || []).join(', ')}

Return ONLY valid JSON (no markdown) with this shape:
{
  "target_role": "${role.title}",
  "estimated_months": number,
  "phases": [
    {
      "phase": 1,
      "title": "Phase title",
      "duration_weeks": number,
      "focus_skills": ["skill1", "skill2"],
      "resources": [
        { "type": "course|book|practice|project", "title": "Resource title", "url_hint": "platform or source name" }
      ],
      "milestone": "What you can do after this phase"
    }
  ],
  "quick_wins": ["thing to do this week 1", "thing to do this week 2"],
  "job_readiness_tips": ["tip1", "tip2", "tip3"]
}`;

    const raw = await callGroq(prompt, 1500);
    let roadmap;
    try {
      const match = raw.match(/\{[\s\S]*\}/);
      roadmap = JSON.parse(match ? match[0] : raw);
    } catch {
      roadmap = {
        target_role: role.title,
        estimated_months: 3,
        phases: [],
        quick_wins: [],
        job_readiness_tips: [],
      };
    }

    return NextResponse.json({ roadmap });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('learning-roadmap error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

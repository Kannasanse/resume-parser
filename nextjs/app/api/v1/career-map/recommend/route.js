import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { callClaude } from '@/lib/aiHelpers.js';

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { session_id, questionnaire } = await request.json();

    const { data: session } = await supabase
      .from('career_map_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Save questionnaire answers
    await supabase
      .from('career_map_sessions')
      .update({ questionnaire, updated_at: new Date().toISOString() })
      .eq('id', session_id);

    // Fetch all roles from DB
    const { data: allRoles } = await supabase
      .from('career_role_database')
      .select('id, title, category, seniority, required_skills, core_skills, salary_min_usd, salary_max_usd, avg_years_exp, description, growth_outlook');

    const profile = session.extracted_profile;

    const prompt = `You are a career advisor. Based on a professional's profile and preferences, recommend 5 suitable career roles from the provided database.

Profile:
${JSON.stringify(profile, null, 2)}

Questionnaire answers:
${JSON.stringify(questionnaire, null, 2)}

Available roles (id + title only for brevity):
${(allRoles || []).map(r => `${r.id}: ${r.title} (${r.category}, ${r.seniority})`).join('\n')}

Return ONLY valid JSON array (no markdown) with exactly 5 role IDs, ordered best-match first:
["role-id-1", "role-id-2", "role-id-3", "role-id-4", "role-id-5"]`;

    const raw = await callClaude(prompt, 400);
    let recommendedIds = [];
    try {
      const match = raw.match(/\[[\s\S]*?\]/);
      recommendedIds = JSON.parse(match ? match[0] : raw);
    } catch {
      recommendedIds = (allRoles || []).slice(0, 5).map(r => r.id);
    }

    // Hydrate with full role data
    const recommendedRoles = recommendedIds
      .map(id => (allRoles || []).find(r => r.id === id))
      .filter(Boolean)
      .map((role, i) => ({ ...role, match_rank: i + 1 }));

    // Save recommendations to session
    await supabase
      .from('career_map_sessions')
      .update({ recommended_roles: recommendedRoles, updated_at: new Date().toISOString() })
      .eq('id', session_id);

    return NextResponse.json({ recommended_roles: recommendedRoles });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('recommend error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

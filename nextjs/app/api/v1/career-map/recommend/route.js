import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callGroq(prompt, maxTokens = 400) {
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
    const { session_id, questionnaire, adaptive_answers } = await request.json();
    // adaptive_answers: array of {questionNumber, questionText, questionIntent, answerValue, answerLabel}
    // questionnaire: legacy flat object (static flow, backward compat)

    const { data: session } = await supabase
      .from('career_map_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Save questionnaire answers (backward compat for static flow)
    if (questionnaire) {
      await supabase
        .from('career_map_sessions')
        .update({ questionnaire, updated_at: new Date().toISOString() })
        .eq('id', session_id);
    }

    // Fetch all roles from DB
    const { data: allRoles } = await supabase
      .from('career_role_database')
      .select('id, title, category, seniority, required_skills, core_skills, salary_min_usd, salary_max_usd, avg_years_exp, description, growth_outlook');

    const profile = session.extracted_profile;

    // Build questionnaire context — adaptive or static
    let questionnaireContext;
    if (adaptive_answers && adaptive_answers.length > 0) {
      questionnaireContext = `Career questionnaire insights (adaptive, ${adaptive_answers.length} questions):\n` +
        adaptive_answers
          .filter(q => q.answerValue)
          .map(q => `${q.questionIntent}: ${q.answerLabel || q.answerValue}`)
          .join('\n');
      const conf = session.confidence_score;
      if (conf) questionnaireContext += `\n\nConfidence when questionnaire ended: ${Math.round(conf * 100)}%`;
    } else {
      questionnaireContext = `Career questionnaire answers:\n${JSON.stringify(questionnaire || {}, null, 2)}`;
    }

    const prompt = `You are a career advisor. Based on this professional's profile and career goals, recommend the best-fit job profiles from the candidate list provided.

Professional profile:
${JSON.stringify(profile, null, 2)}

${questionnaireContext}

Available roles:
${(allRoles || []).map(r => `${r.id}: ${r.title} (${r.category}, ${r.seniority})`).join('\n')}

Task:
1. Re-rank these roles based on all available information
2. Add 1-2 "surprise" roles not in the list if you see strong diagonal skill overlap
3. Return the best 5 role IDs ordered best-match first

Return ONLY a JSON array of exactly 5 role IDs from the list above (no markdown):
["role-id-1", "role-id-2", "role-id-3", "role-id-4", "role-id-5"]`;

    const raw = await callGroq(prompt, 400);
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

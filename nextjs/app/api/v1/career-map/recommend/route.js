import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const {
      session_id,
      // New adaptive flow
      extractedProfile,
      questionnaireAnswers,
      confidenceScore,
      questionCount,
      // Legacy flat questionnaire (backward compat)
      questionnaire,
      adaptive_answers,
    } = await request.json();

    const { data: session } = await supabase
      .from('career_map_sessions')
      .select('*')
      .eq('id', session_id)
      .eq('user_id', user.id)
      .single();

    if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 });

    // Resolve profile and answers from whichever call convention was used
    const profile = extractedProfile || session.extracted_profile;
    const answers = questionnaireAnswers || adaptive_answers || [];
    const confScore = confidenceScore ?? session.confidence_score ?? 0;
    const qCount = questionCount ?? answers.length ?? 0;

    // Save questionnaire answers for legacy static flow
    if (questionnaire) {
      await supabase
        .from('career_map_sessions')
        .update({ questionnaire, updated_at: new Date().toISOString() })
        .eq('id', session_id);
    }

    const hasAdaptiveAnswers = answers.length > 0;

    let prompt;

    if (hasAdaptiveAnswers) {
      const answersBlock = answers
        .filter(q => q.answerValue)
        .map(q => `[${q.questionIntent}]\nQ: ${q.questionText}\nA: ${q.answerLabel || q.answerValue}`)
        .join('\n\n');

      prompt = `You are a senior career advisor generating personalised career path recommendations.

You have two sources of information about this professional:

── RESUME PROFILE ──────────────────────────────────────────
Current title:       ${profile.currentTitle}
Seniority:           ${profile.currentSeniority}
Domain:              ${profile.currentDomain}
Years of experience: ${profile.totalYearsExp}
Skills:              ${(profile.skills || []).join(', ')}
Industries:          ${(profile.industries || []).join(', ')}
Education:           ${profile.educationLevel}
Tech stack:          ${(profile.topTechStack || []).join(', ')}
Has management exp:  ${profile.hasManagement}
Certifications:      ${(profile.certifications || []).join(', ')}

── WHAT THEY TOLD US (Adaptive Questionnaire) ──────────────
${answersBlock}

Questionnaire confidence: ${Math.round(confScore * 100)}%
Questions answered: ${qCount}
────────────────────────────────────────────────────────────

Based on BOTH the resume AND what they explicitly told you, recommend 4–6 career roles.

Rules for recommendations:
1. Use the questionnaire answers as the PRIMARY signal for direction and preferences
2. Use the resume as evidence of capability and readiness
3. Each recommendation must reference something specific the person said or demonstrated
4. Do NOT recommend roles that clearly conflict with what they said
   (e.g. if they said they want to avoid management, do not recommend Engineering Manager)
5. Cover at least 2 path types: vertical (same domain, higher level) and at least one of
   horizontal (adjacent domain, same level) or diagonal (skill-overlap pivot)
6. Salary ranges must be realistic for their experience level and location context
7. If they mentioned specific industries, prioritise roles in those industries

Path type definitions:
  vertical:   Same domain, higher seniority (e.g. Senior Dev → Lead Dev → Principal)
  horizontal: Adjacent domain, same seniority (e.g. Backend Dev → Data Engineer)
  diagonal:   Different field leveraging overlapping skills (e.g. Dev → Product Manager)

For each recommended role, provide:
  - A realistic readiness score based on skill overlap with their current profile
  - A personalised reason that quotes or paraphrases something they actually said
  - Estimated transition timeline in months
  - Salary range in USD annual

Return ONLY a JSON object with a "recommendations" key containing an array of 4–6 items:
{
  "recommendations": [
    {
      "roleId":           "unique-role-identifier",
      "title":            "Role Title",
      "category":         "Engineering|Data|Design|Product|Management|Marketing|Finance|Operations|Other",
      "seniority":        "Junior|Mid|Senior|Lead|Principal|Director|C-Level",
      "pathType":         "vertical|horizontal|diagonal",
      "readinessScore":   0-100,
      "reason":           "Personalised 1-sentence reason referencing their background or answers",
      "estimatedMonths":  number,
      "salaryMinUsd":     number,
      "salaryMaxUsd":     number,
      "keySkillsNeeded":  ["skill1", "skill2", "skill3"],
      "matchedSkills":    ["skill1", "skill2"]
    }
  ]
}

Order by best fit first. No preamble.`;
    } else {
      // Legacy static questionnaire — simpler prompt
      const questionnaireContext = questionnaire
        ? `Career questionnaire answers:\n${JSON.stringify(questionnaire, null, 2)}`
        : 'No questionnaire answers provided.';

      prompt = `You are a senior career advisor. Based on this professional's profile and career goals, recommend the best-fit career roles.

Professional profile:
${JSON.stringify(profile, null, 2)}

${questionnaireContext}

Recommend 4–6 career roles based on the profile. For each provide a personalised reason.

Return ONLY a JSON object:
{
  "recommendations": [
    {
      "roleId": "unique-id",
      "title": "Role Title",
      "category": "Engineering|Data|Design|Product|Management|Marketing|Finance|Operations|Other",
      "seniority": "Junior|Mid|Senior|Lead|Principal|Director|C-Level",
      "pathType": "vertical|horizontal|diagonal",
      "readinessScore": 0-100,
      "reason": "1-sentence reason",
      "estimatedMonths": number,
      "salaryMinUsd": number,
      "salaryMaxUsd": number,
      "keySkillsNeeded": ["skill1"],
      "matchedSkills": ["skill1"]
    }
  ]
}
No preamble.`;
    }

    const res = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 1200,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = res.choices?.[0]?.message?.content ?? '{}';
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    const recommendedRoles = (parsed.recommendations || []).map((role, i) => ({
      id: role.roleId || `ai-role-${i + 1}`,
      title: role.title || 'Unknown Role',
      category: role.category || 'Other',
      seniority: role.seniority || 'Mid',
      pathType: role.pathType || 'vertical',
      readiness_score: role.readinessScore ?? 70,
      reason: role.reason || '',
      estimated_months: role.estimatedMonths ?? 6,
      salary_min_usd: role.salaryMinUsd ?? 0,
      salary_max_usd: role.salaryMaxUsd ?? 0,
      key_skills_needed: role.keySkillsNeeded || [],
      matched_skills: role.matchedSkills || [],
      match_rank: i + 1,
    }));

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

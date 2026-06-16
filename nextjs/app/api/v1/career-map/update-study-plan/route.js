import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { callGemini } from '@/lib/gemini';
import { randomUUID } from 'crypto';
import { deductCredits, getBalance, CREDIT_COSTS } from '@/lib/credits.js';

function normalize(s) { return (s || '').toLowerCase().trim(); }

function findBestHeadingMatch(newHeading, oldSections) {
  const exact = oldSections.find(s => normalize(s.heading) === normalize(newHeading));
  if (exact) return exact;
  const firstWord = normalize(newHeading).split(' ')[0];
  return oldSections.find(s =>
    normalize(s.heading).includes(firstWord) ||
    normalize(newHeading).includes(normalize(s.heading).split(' ')[0])
  ) ?? null;
}

export async function POST(request) {
  try {
    const { user } = await requireUser(request);

    const balance = await getBalance(user.id);
    const COST = CREDIT_COSTS['course_create'];
    if (balance < COST) {
      return NextResponse.json(
        { error: `Insufficient credits. This action costs ${COST} credits.`, code: 'insufficient_credits', balance },
        { status: 402 }
      );
    }

    const { planId, preferences } = await request.json();
    const { hoursPerDay, daysPerWeek, learningStyle, currentLevel } = preferences;

    // Fetch current plan
    const { data: plan, error: planErr } = await supabase
      .from('study_plans')
      .select('*')
      .eq('id', planId)
      .eq('user_id', user.id)
      .single();
    if (planErr || !plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    // Fetch current topics (for content preservation)
    const { data: oldTopics } = await supabase
      .from('study_plan_topics')
      .select('id, sections')
      .eq('study_plan_id', planId);

    const allOldSections = (oldTopics || []).flatMap(t => t.sections || []);

    // Regenerate plan via Groq
    const styles = Array.isArray(learningStyle) ? learningStyle : [learningStyle];
    const isVideoFirst = styles.includes('video-first');
    const isMixed = styles.includes('mixed');

    let sectionTypeRules = '';
    if (isVideoFirst) {
      sectionTypeRules = `Section structure: The FIRST section of every topic must be type "video-only" with heading "Watch: [specific video topic description]" and estimatedReadMinutes: 0. Remaining sections are type "text".`;
    } else if (isMixed) {
      sectionTypeRules = `Section structure: Every 2nd section (sections 2, 4, 6...) must be type "video-only" with heading "Watch: [specific video topic description]" and estimatedReadMinutes: 0. Other sections are type "text-with-video" for section 1, and "text" for the rest.`;
    } else {
      sectionTypeRules = `Section structure: All sections are type "text". No video-only sections.`;
    }

    const prompt = `You are a curriculum designer creating a personalised study plan.

Target role: ${plan.target_role_title}
Skills to learn: ${(plan.missing_skills || []).join(', ')}
Study hours/day: ${hoursPerDay}
Study days/week: ${daysPerWeek}
Learning style: ${styles.join(', ')}
Current level: ${currentLevel}

${sectionTypeRules}

Create a week-by-week study plan. Each week contains 2-4 topics.
Each topic covers one skill or one sub-area of a skill.

Rules:
- Order topics from foundational to advanced
- Beginner level: start from absolute basics
- Each topic should be completable in 2-6 hours
- Topic title should be specific and actionable
- Each topic must have 4-8 sections with specific headings
- Section headings should be specific and educational
- Assign a YouTube search query per topic that would find a good tutorial
- Distribute topics across weeks based on ${hoursPerDay * daysPerWeek} hours per week

Return ONLY a JSON object:
{
  "totalWeeks": number,
  "totalHours": number,
  "weeks": [
    {
      "weekNumber": 1,
      "theme": "Week theme title",
      "topics": [
        {
          "topicOrder": 1,
          "skill": "skill name",
          "title": "specific topic title",
          "description": "1-2 sentence overview",
          "estimatedHours": number,
          "youtubeQuery": "specific youtube search query",
          "sections": [
            {
              "id": "s1",
              "order": 1,
              "heading": "specific section heading",
              "type": "video-only|text|text-with-video",
              "estimatedReadMinutes": number
            }
          ]
        }
      ]
    }
  ]
}`;

    let newPlan;
    try {
      newPlan = await callGemini(prompt, { json: true, temperature: 0.7 });
      if (!newPlan || typeof newPlan !== 'object') throw new Error('invalid');
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Build new topic rows with content preservation
    const newTopicRows = [];
    for (const week of newPlan.weeks || []) {
      for (const topic of week.topics || []) {
        const sections = (topic.sections || []).map(s => {
          const matched = findBestHeadingMatch(s.heading, allOldSections);
          const preserved = matched?.is_generated && matched?.content
            ? { content: matched.content, is_generated: true, generation_status: 'done' }
            : { content: null, is_generated: false, generation_status: 'idle' };
          return {
            ...s,
            id: randomUUID(),
            youtube_video_id: null,
            type: s.type || 'text',
            ...preserved,
          };
        });
        newTopicRows.push({
          study_plan_id: planId,
          week_number: week.weekNumber,
          topic_order: topic.topicOrder,
          skill: topic.skill,
          title: topic.title,
          description: topic.description || null,
          estimated_hours: topic.estimatedHours,
          sections,
          youtube_queries: [topic.youtubeQuery].filter(Boolean),
          is_completed: false,
          completed_at: null,
        });
      }
    }

    // Append to preferences_history (keep last 5)
    const history = Array.isArray(plan.preferences_history) ? plan.preferences_history : [];
    const newHistory = [
      ...history,
      { preferences: plan.preferences, updatedAt: new Date().toISOString() },
    ].slice(-5);

    // Delete old topics
    await supabase.from('study_plan_topics').delete().eq('study_plan_id', planId);

    // Delete old progress (sections changed — IDs changed)
    const oldTopicIds = (oldTopics || []).map(t => t.id);
    if (oldTopicIds.length > 0) {
      await supabase.from('study_plan_progress').delete().eq('user_id', user.id).in('topic_id', oldTopicIds);
    }

    // Insert new topics
    if (newTopicRows.length > 0) {
      const { error: insertErr } = await supabase.from('study_plan_topics').insert(newTopicRows);
      if (insertErr) throw insertErr;
    }

    // Update plan
    await supabase.from('study_plans').update({
      preferences,
      preferences_history: newHistory,
      plan_structure: newPlan,
      total_weeks: newPlan.totalWeeks,
      total_hours: newPlan.totalHours,
      updated_at: new Date().toISOString(),
    }).eq('id', planId);

    const { ok, balance: newBalance } = await deductCredits(user.id, 'course_create');
    if (!ok) return NextResponse.json({ error: 'Insufficient credits.', code: 'insufficient_credits', balance: 0 }, { status: 402 });

    return NextResponse.json({ ok: true, planId, credits_used: COST, credits_remaining: newBalance });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('update-study-plan error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

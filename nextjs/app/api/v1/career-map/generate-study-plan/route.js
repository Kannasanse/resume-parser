import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';
import { randomUUID } from 'crypto';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { sessionId, targetRoleId, targetRoleTitle, missingSkills, preferences } = await request.json();

    const { hoursPerDay, daysPerWeek, learningStyle, currentLevel } = preferences;
    const styles = Array.isArray(learningStyle) ? learningStyle : [learningStyle];
    const isVideoFirst = styles.includes('video-first');
    const isMixed = styles.includes('mixed');
    let sectionTypeRules = '';
    if (isVideoFirst) {
      sectionTypeRules = `Section structure: The FIRST section of every topic must be type "video-only" with heading starting "Watch: " and estimatedReadMinutes: 0. Remaining sections are type "text".`;
    } else if (isMixed) {
      sectionTypeRules = `Section structure: Every 2nd section (order 2, 4, 6) must be type "video-only" with heading starting "Watch: " and estimatedReadMinutes: 0. Other sections are type "text".`;
    } else {
      sectionTypeRules = `Section structure: All sections are type "text". No video-only sections.`;
    }

    const prompt = `You are a curriculum designer creating a personalised study plan.

Target role: ${targetRoleTitle}
Skills to learn: ${missingSkills.join(', ')}
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
- Topic title should be specific and actionable (e.g. "Docker containers and images" not just "Docker")
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
          "skill": "skill name from missing skills",
          "title": "specific topic title",
          "description": "1-2 sentence overview of what this topic covers",
          "estimatedHours": number,
          "youtubeQuery": "specific youtube search query for this topic",
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

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      max_tokens: 4000,
      response_format: { type: 'json_object' },
      messages: [{ role: 'user', content: prompt }],
    });

    let plan;
    try {
      plan = JSON.parse(completion.choices[0].message.content);
    } catch {
      return NextResponse.json({ error: 'Failed to parse AI response' }, { status: 500 });
    }

    // Persist study plan
    const { data: studyPlan, error: planError } = await supabase
      .from('study_plans')
      .insert({
        user_id: user.id,
        session_id: sessionId || null,
        target_role_id: targetRoleId,
        target_role_title: targetRoleTitle,
        missing_skills: missingSkills,
        preferences,
        plan_structure: plan,
        total_weeks: plan.totalWeeks,
        total_hours: plan.totalHours,
      })
      .select('id')
      .single();

    if (planError) throw planError;

    // Persist topics with unique section IDs
    const topicRows = [];
    for (const week of plan.weeks || []) {
      for (const topic of week.topics || []) {
        const sections = (topic.sections || []).map((s, i) => ({
          ...s,
          id: `${randomUUID()}`,
          type: s.type || 'text',
          content: null,
          content_type: 'placeholder',
          is_generated: false,
          generation_status: 'idle',
          youtube_video_id: null,
        }));
        topicRows.push({
          study_plan_id: studyPlan.id,
          week_number: week.weekNumber,
          topic_order: topic.topicOrder,
          skill: topic.skill,
          title: topic.title,
          description: topic.description || null,
          estimated_hours: topic.estimatedHours,
          sections,
          youtube_queries: [topic.youtubeQuery].filter(Boolean),
        });
      }
    }

    if (topicRows.length > 0) {
      const { error: topicError } = await supabase.from('study_plan_topics').insert(topicRows);
      if (topicError) throw topicError;
    }

    return NextResponse.json({ study_plan_id: studyPlan.id, plan });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('generate-study-plan error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

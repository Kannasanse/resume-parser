import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';
import { randomUUID } from 'crypto';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const {
      sessionId, targetRoleId, targetRoleTitle, missingSkills, preferences,
      creation_mode = 'career_map', selectedSkills = [],
    } = await request.json();

    const { hoursPerDay, daysPerWeek, learningStyle, currentLevel } = preferences;
    const styles = Array.isArray(learningStyle) ? learningStyle : [learningStyle];
    const isVideoFirst = styles.includes('video-first');
    const isMixed = styles.includes('mixed');

    let sectionTypeRules = '';
    if (isVideoFirst) {
      sectionTypeRules = `Section type rules:
- The FIRST section of every topic must be section_type "video" (type "video-only"), heading starting "Watch: ", estimatedReadMinutes 0.
- ~50% of remaining sections: section_type "practical" (type "text-with-video").
- One section per topic: section_type "exercise".
- Last section per topic: section_type "summary".
- Remaining sections: section_type "concept".
- Never two consecutive "video" sections.`;
    } else if (isMixed) {
      sectionTypeRules = `Section type rules:
- Every 2nd or 3rd section should be section_type "practical" (type "text-with-video"), aiming for ~40% of sections.
- One section per topic may be section_type "video" (type "video-only"), heading starting "Watch: ", estimatedReadMinutes 0.
- One section per topic: section_type "exercise".
- Last section per topic: section_type "summary".
- Remaining sections: section_type "concept".`;
    } else {
      sectionTypeRules = `Section type rules:
- First 1–2 sections per topic: section_type "concept".
- Middle sections: alternate "concept" and "practical".
- One section per topic: section_type "exercise".
- Last section per topic: section_type "summary".
- No "video" section_type (text-only learning style).`;
    }

    const prompt = `You are a senior curriculum designer creating a personalised, beginner-friendly study plan.

Target role: ${targetRoleTitle}
Skills to learn: ${missingSkills.join(', ')}
Study hours/day: ${hoursPerDay}
Study days/week: ${daysPerWeek}
Learning style: ${styles.join(', ')}
Current level: ${currentLevel}

${sectionTypeRules}

Create a week-by-week study plan. Each week contains 2–4 topics.
Each topic covers one skill or one focused sub-area of a skill.

Rules:
- Order topics from foundational to advanced
- Beginner level: start from absolute basics, never assume prior knowledge
- Each topic completable in 2–6 hours
- Topic title: specific and actionable (e.g. "Docker containers and images" not just "Docker")
- Each topic must have 5–8 sections with specific headings
- Section headings: specific and educational (e.g. "How Python lists store data in memory")
- prerequisites: list 1–3 topic titles that should be completed before this one (use [] for first topics)
- real_world_application: one concrete sentence describing where this topic is used in production
- search_query per section: 6–12 words crafted for Tavily/web search to find excellent reference material for THAT specific heading (not the whole skill). Make it specific — include the exact sub-topic and the skill name. For exercise/summary/video sections set search_query to "".
- Assign a YouTube search query per topic (4–8 words, include sub-topic + "tutorial"/"explained"/"guide"). All queries must be unique.
- Distribute topics across weeks based on ${hoursPerDay * daysPerWeek} hours per week

Return ONLY a valid JSON object (no markdown fences):
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
          "description": "1–2 sentence overview",
          "estimatedHours": number,
          "estimatedMinutes": number,
          "prerequisites": ["topic title 1"],
          "real_world_application": "one sentence about real production use",
          "youtubeQuery": "specific youtube search query",
          "sections": [
            {
              "id": "s1",
              "order": 1,
              "heading": "specific section heading",
              "section_type": "concept|practical|exercise|video|summary",
              "type": "text|text-with-video|video-only",
              "estimatedReadMinutes": number,
              "estimated_minutes": number,
              "search_query": "tavily search query for this section or empty string",
              "learning_objectives": ["learner will be able to...", "learner will understand...", "learner will practise..."],
              "difficulty_note": "one short sentence about what makes this section challenging or accessible"
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
      max_tokens: 6000,
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
        target_role_id: targetRoleId || null,
        target_role_title: targetRoleTitle || null,
        missing_skills: missingSkills,
        preferences,
        plan_structure: plan,
        total_weeks: plan.totalWeeks,
        total_hours: plan.totalHours,
        creation_mode,
        selected_skills: selectedSkills,
      })
      .select('id')
      .single();

    if (planError) throw planError;

    // Persist topics
    const topicRows = [];
    for (const week of plan.weeks || []) {
      for (const topic of week.topics || []) {
        const sections = (topic.sections || []).map(s => ({
          ...s,
          id: randomUUID(),
          type: s.type || 'text',
          section_type: s.section_type || 'concept',
          search_query: s.search_query || '',
          learning_objectives: s.learning_objectives || [],
          difficulty_note: s.difficulty_note || '',
          estimated_minutes: s.estimated_minutes || s.estimatedReadMinutes || 10,
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
          estimated_minutes: topic.estimatedMinutes || Math.round((topic.estimatedHours || 0) * 60),
          prerequisites: topic.prerequisites || [],
          real_world_application: topic.real_world_application || null,
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

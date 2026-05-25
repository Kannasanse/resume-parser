import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';
import { generateFromWeb } from '@/lib/career-map/generateFromWeb.js';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { user } = await requireUser(request);
    const {
      topicId,
      sectionId,
      sectionHeading,
      topicTitle,
      skill,
      currentLevel,
      learningStyle,
      precedingSections,
      source = 'ai',
    } = body;

    // Verify ownership
    const { data: topic } = await supabase
      .from('study_plan_topics')
      .select('id, sections, study_plan_id')
      .eq('id', topicId)
      .single();

    if (!topic) return NextResponse.json({ error: 'Topic not found' }, { status: 404 });

    const { data: plan } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', topic.study_plan_id)
      .eq('user_id', user.id)
      .single();

    if (!plan) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

    // Mark generating
    const sections = (topic.sections || []).map(s =>
      s.id === sectionId ? { ...s, generation_status: 'generating' } : s
    );
    await supabase.from('study_plan_topics').update({ sections, updated_at: new Date().toISOString() }).eq('id', topicId);

    let content;
    let sourceFields = { source_type: 'ai', source_url: null, source_title: null, source_domain: null, fetched_at: null };

    if (source === 'web') {
      const webResult = await generateFromWeb({ sectionHeading, skill, currentLevel });
      if (webResult) {
        content = webResult.content;
        sourceFields = {
          source_type: webResult.source_type,
          source_url: webResult.source_url,
          source_title: webResult.source_title,
          source_domain: webResult.source_domain,
          fetched_at: webResult.fetched_at,
        };
      } else {
        content = await generateWithAI({ groq, sectionHeading, topicTitle, skill, currentLevel, learningStyle, precedingSections });
        sourceFields = { source_type: 'ai_fallback', source_url: null, source_title: null, source_domain: null, fetched_at: null };
      }
    } else {
      content = await generateWithAI({ groq, sectionHeading, topicTitle, skill, currentLevel, learningStyle, precedingSections });
    }

    // Update section with generated content
    const updatedSections = (topic.sections || []).map(s =>
      s.id === sectionId
        ? { ...s, content, is_generated: true, generation_status: 'done', content_type: 'generated', ...sourceFields }
        : s
    );

    await supabase
      .from('study_plan_topics')
      .update({ sections: updatedSections, updated_at: new Date().toISOString() })
      .eq('id', topicId);

    return NextResponse.json({ content, section_id: sectionId, ...sourceFields });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('generate-section-content error:', err);

    // Mark error state
    try {
      const { topicId, sectionId } = body || {};
      if (topicId && sectionId) {
        const { data: topic } = await supabase.from('study_plan_topics').select('sections').eq('id', topicId).single();
        if (topic) {
          const sections = (topic.sections || []).map(s =>
            s.id === sectionId ? { ...s, generation_status: 'error' } : s
          );
          await supabase.from('study_plan_topics').update({ sections }).eq('id', topicId);
        }
      }
    } catch {}

    return NextResponse.json({ error: 'Content generation failed. Please try again.' }, { status: 500 });
  }
}

async function generateWithAI({ groq, sectionHeading, topicTitle, skill, currentLevel, learningStyle, precedingSections }) {
  const prompt = `You are an expert technical educator writing study material for a professional learner.

Topic: ${topicTitle}
Skill: ${skill}
Section heading: ${sectionHeading}
Learner level: ${currentLevel}
Learning style: ${Array.isArray(learningStyle) ? learningStyle.join(', ') : learningStyle}
Context (previous sections covered): ${(precedingSections || []).join(', ') || 'None'}

Write educational content for this section. Guidelines:
- Write for a ${currentLevel} learner — adjust complexity accordingly
- Length: 300–600 words (not too short, not overwhelming)
- Structure with 2-3 sub-headings (use ### for h3)
- Include a practical example or code snippet if relevant to the skill
- If learning style includes "project-based": end with a mini exercise or challenge
- Use clear, direct language — no fluff
- Do NOT repeat content from previous sections
- Do NOT include a title (the heading is already shown above)

Return the content as clean markdown. No preamble, no "Here is the content:".
Start directly with the first paragraph or sub-heading.`;

  const completion = await groq.chat.completions.create({
    model: 'llama-3.1-8b-instant',
    temperature: 0.5,
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  return completion.choices[0].message.content || '';
}

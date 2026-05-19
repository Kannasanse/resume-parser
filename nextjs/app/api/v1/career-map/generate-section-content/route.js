import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import Groq from 'groq-sdk';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(request) {
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
    } = await request.json();

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
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = completion.choices[0].message.content || '';

    // Update section with generated content
    const updatedSections = (topic.sections || []).map(s =>
      s.id === sectionId
        ? { ...s, content, is_generated: true, generation_status: 'done', content_type: 'generated' }
        : s
    );

    await supabase
      .from('study_plan_topics')
      .update({ sections: updatedSections, updated_at: new Date().toISOString() })
      .eq('id', topicId);

    return NextResponse.json({ content, section_id: sectionId });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('generate-section-content error:', err);

    // Mark error state
    if (request.body) {
      try {
        const { topicId, sectionId } = await request.json().catch(() => ({}));
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
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

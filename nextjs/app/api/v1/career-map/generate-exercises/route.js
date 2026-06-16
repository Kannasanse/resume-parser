import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { synthesiseContent } from '@/lib/career-map/synthesiseContent.js';

export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  try {
    const { user } = await requireUser(request);
    const { topicId, currentLevel = 'intermediate', learningStyle } = body;

    const { data: topic } = await supabase
      .from('study_plan_topics')
      .select('id, title, skill, sections, study_plan_id')
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

    const exerciseSections = (topic.sections || []).filter(s => s.section_type === 'exercise');
    if (exerciseSections.length === 0) {
      return NextResponse.json({ error: 'No exercise sections found for this topic' }, { status: 400 });
    }

    // Collect generated concept/practical sections as context
    const precedingSections = (topic.sections || [])
      .filter(s => s.is_generated && s.content && s.section_type !== 'exercise' && s.section_type !== 'summary')
      .map(s => s.heading);

    // Generate all exercise sections
    const updatedSections = [...(topic.sections || [])];
    const results = [];

    for (const ex of exerciseSections) {
      const idx = updatedSections.findIndex(s => s.id === ex.id);
      if (idx < 0) continue;

      updatedSections[idx] = { ...updatedSections[idx], generation_status: 'generating' };
      await supabase
        .from('study_plan_topics')
        .update({ sections: updatedSections, updated_at: new Date().toISOString() })
        .eq('id', topicId);

      const content = await synthesiseContent({
        sectionType: 'exercise',
        sectionHeading: ex.heading,
        topicTitle: topic.title,
        skill: topic.skill,
        currentLevel,
        learningStyle,
        precedingSections,
      });

      updatedSections[idx] = {
        ...updatedSections[idx],
        content,
        is_generated: true,
        generation_status: 'done',
        content_type: 'generated',
        source_type: 'ai',
      };

      await supabase
        .from('study_plan_topics')
        .update({ sections: updatedSections, updated_at: new Date().toISOString() })
        .eq('id', topicId);

      results.push({ section_id: ex.id, content });
    }

    return NextResponse.json({ exercises: results });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('generate-exercises error:', err);
    return NextResponse.json({ error: 'Exercise generation failed. Please try again.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { topicId, sectionId, completed } = await request.json();

    const now = new Date().toISOString();

    if (completed) {
      await supabase.from('study_plan_progress').upsert({
        user_id: user.id,
        topic_id: topicId,
        section_id: sectionId,
        is_completed: true,
        completed_at: now,
      }, { onConflict: 'user_id,topic_id,section_id' });
    } else {
      await supabase
        .from('study_plan_progress')
        .delete()
        .eq('user_id', user.id)
        .eq('topic_id', topicId)
        .eq('section_id', sectionId);
    }

    // Recalculate topic completion
    const { data: topic } = await supabase
      .from('study_plan_topics')
      .select('sections')
      .eq('id', topicId)
      .single();

    const totalSections = (topic?.sections || []).length;

    const { count: completedCount } = await supabase
      .from('study_plan_progress')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('topic_id', topicId)
      .eq('is_completed', true);

    const isTopicComplete = totalSections > 0 && completedCount >= totalSections;

    if (isTopicComplete) {
      await supabase
        .from('study_plan_topics')
        .update({ is_completed: true, completed_at: now, updated_at: now })
        .eq('id', topicId);
    }

    return NextResponse.json({
      ok: true,
      completed_sections: completedCount,
      total_sections: totalSections,
      topic_completed: isTopicComplete,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('complete-section error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

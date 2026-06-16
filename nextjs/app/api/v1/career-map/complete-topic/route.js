import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { topicId } = await request.json();

    const now = new Date().toISOString();

    // Verify ownership
    const { data: topic } = await supabase
      .from('study_plan_topics')
      .select('id, study_plan_id, sections')
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

    // Mark all sections complete
    const sectionUpserts = (topic.sections || []).map(s => ({
      user_id: user.id,
      topic_id: topicId,
      section_id: s.id,
      is_completed: true,
      completed_at: now,
    }));

    if (sectionUpserts.length > 0) {
      await supabase.from('study_plan_progress').upsert(sectionUpserts, { onConflict: 'user_id,topic_id,section_id' });
    }

    await supabase
      .from('study_plan_topics')
      .update({ is_completed: true, completed_at: now, updated_at: now })
      .eq('id', topicId);

    // Check if all topics in the plan are done
    const { data: allTopics } = await supabase
      .from('study_plan_topics')
      .select('is_completed')
      .eq('study_plan_id', topic.study_plan_id);

    const allDone = (allTopics || []).every(t => t.is_completed);
    if (allDone) {
      await supabase
        .from('study_plans')
        .update({ status: 'completed', updated_at: now })
        .eq('id', topic.study_plan_id);
    }

    return NextResponse.json({ ok: true, plan_completed: allDone });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('complete-topic error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

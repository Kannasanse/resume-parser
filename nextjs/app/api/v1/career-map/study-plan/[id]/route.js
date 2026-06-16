import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function GET(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    const { data: plan } = await supabase
      .from('study_plans')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (!plan) return NextResponse.json({ error: 'Plan not found' }, { status: 404 });

    const { data: topics } = await supabase
      .from('study_plan_topics')
      .select('*')
      .eq('study_plan_id', id)
      .order('week_number')
      .order('topic_order');

    const topicIds = (topics || []).map(t => t.id);
    let progressRows = [];
    if (topicIds.length > 0) {
      const { data } = await supabase
        .from('study_plan_progress')
        .select('topic_id, section_id, is_completed')
        .eq('user_id', user.id)
        .in('topic_id', topicIds);
      progressRows = data || [];
    }

    // Build progress map: { topicId: Set<sectionId> }
    const progressMap = {};
    for (const row of progressRows) {
      if (!row.is_completed) continue;
      if (!progressMap[row.topic_id]) progressMap[row.topic_id] = new Set();
      progressMap[row.topic_id].add(row.section_id);
    }

    const enrichedTopics = (topics || []).map(t => {
      const completedSections = progressMap[t.id]?.size || 0;
      const totalSections = (t.sections || []).length;
      const pct = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;
      return {
        ...t,
        completed_section_ids: [...(progressMap[t.id] || [])],
        completion_pct: pct,
        status: pct === 0 ? 'not_started' : pct === 100 ? 'completed' : 'in_progress',
      };
    });

    const totalTopics = enrichedTopics.length;
    const completedTopics = enrichedTopics.filter(t => t.is_completed).length;
    const overallPct = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

    return NextResponse.json({
      plan: { ...plan, overall_pct: overallPct, completed_topics: completedTopics, total_topics: totalTopics },
      topics: enrichedTopics,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('study-plan GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

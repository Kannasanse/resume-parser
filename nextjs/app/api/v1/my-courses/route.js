import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function GET(request) {
  try {
    const { user } = await requireUser(request);

    // Fetch all non-archived plans
    const { data: plans, error } = await supabase
      .from('study_plans')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    if (!plans?.length) return NextResponse.json({ courses: [] });

    const planIds = plans.map(p => p.id);

    // Fetch all topics for these plans
    const { data: topics } = await supabase
      .from('study_plan_topics')
      .select('id, study_plan_id, week_number, topic_order, sections, is_completed, completed_at')
      .in('study_plan_id', planIds);

    const topicIds = (topics || []).map(t => t.id);

    // Fetch progress
    let progress = [];
    if (topicIds.length > 0) {
      const { data } = await supabase
        .from('study_plan_progress')
        .select('topic_id, section_id, is_completed, completed_at')
        .eq('user_id', user.id)
        .in('topic_id', topicIds)
        .eq('is_completed', true);
      progress = data || [];
    }

    // Build lookup maps
    const topicsByPlan = {};
    for (const t of topics || []) {
      if (!topicsByPlan[t.study_plan_id]) topicsByPlan[t.study_plan_id] = [];
      topicsByPlan[t.study_plan_id].push(t);
    }

    const progressByTopic = {};
    for (const p of progress) {
      if (!progressByTopic[p.topic_id]) progressByTopic[p.topic_id] = [];
      progressByTopic[p.topic_id].push(p);
    }

    const courses = plans.map(plan => {
      const planTopics = topicsByPlan[plan.id] || [];
      const totalTopics = planTopics.length;
      const totalSections = planTopics.reduce((sum, t) => sum + (t.sections?.length || 0), 0);
      const completedTopics = planTopics.filter(t => t.is_completed).length;

      let completedSections = 0;
      let lastStudiedAt = null;

      for (const t of planTopics) {
        const tp = progressByTopic[t.id] || [];
        completedSections += tp.length;
        for (const p of tp) {
          if (p.completed_at && (!lastStudiedAt || p.completed_at > lastStudiedAt)) {
            lastStudiedAt = p.completed_at;
          }
        }
      }

      const overallPercent = totalSections > 0 ? Math.round((completedSections / totalSections) * 100) : 0;

      // Compute resume destination
      let resumeTopicId = null;
      let resumeSectionId = null;

      const sortedTopics = [...planTopics].sort((a, b) =>
        a.week_number !== b.week_number ? a.week_number - b.week_number : a.topic_order - b.topic_order
      );

      for (const t of sortedTopics) {
        if (t.is_completed) continue;
        const tp = progressByTopic[t.id] || [];
        const completedSectionIds = new Set(tp.map(p => p.section_id));
        const firstIncomplete = (t.sections || []).find(s => !completedSectionIds.has(s.id));
        resumeTopicId = t.id;
        resumeSectionId = firstIncomplete?.id || null;
        break;
      }

      if (!resumeTopicId && sortedTopics.length > 0) {
        resumeTopicId = sortedTopics[0].id;
      }

      return {
        id: plan.id,
        targetRoleTitle: plan.target_role_title,
        targetRoleId: plan.target_role_id,
        status: plan.status,
        totalHours: plan.total_hours,
        estimatedWeeks: plan.total_weeks,
        totalTopics,
        totalSections,
        completedSections,
        completedTopics,
        overallPercent,
        lastStudiedAt,
        createdAt: plan.created_at,
        updatedAt: plan.updated_at,
        preferences: plan.preferences,
        resumeTopicId,
        resumeSectionId,
        creationMode: plan.creation_mode || 'career_map',
        selectedSkills: plan.selected_skills || [],
      };
    });

    return NextResponse.json({ courses });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('my-courses GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

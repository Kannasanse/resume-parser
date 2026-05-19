import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function GET(request) {
  try {
    const { user } = await requireUser(request);

    const { data: plans } = await supabase
      .from('study_plans')
      .select('id, status, total_hours')
      .eq('user_id', user.id)
      .neq('status', 'archived');

    const total = plans?.length || 0;
    const inProgress = (plans || []).filter(p => p.status === 'active').length;
    const completed = (plans || []).filter(p => p.status === 'completed').length;

    // Hours studied = sum of completed topics' estimated_hours
    const planIds = (plans || []).map(p => p.id);
    let hoursStudied = 0;

    if (planIds.length > 0) {
      const { data: completedTopics } = await supabase
        .from('study_plan_topics')
        .select('estimated_hours')
        .in('study_plan_id', planIds)
        .eq('is_completed', true);

      hoursStudied = (completedTopics || []).reduce((sum, t) => sum + Number(t.estimated_hours || 0), 0);
    }

    return NextResponse.json({ total, inProgress, completed, hoursStudied: Math.round(hoursStudied) });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

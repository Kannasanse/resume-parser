import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export async function POST(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    // Verify the plan belongs to the user
    const { data: plan, error: planError } = await supabase
      .from('study_plans')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (planError || !plan) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    // Get all topic IDs for this plan
    const { data: topics } = await supabase
      .from('study_plan_topics')
      .select('id')
      .eq('study_plan_id', id);

    const topicIds = (topics || []).map(t => t.id);

    if (topicIds.length > 0) {
      // Delete all progress rows
      await supabase
        .from('study_plan_progress')
        .delete()
        .eq('user_id', user.id)
        .in('topic_id', topicIds);

      // Mark all topics as not completed
      await supabase
        .from('study_plan_topics')
        .update({ is_completed: false, completed_at: null })
        .in('id', topicIds);
    }

    // Reset plan status to active
    await supabase
      .from('study_plans')
      .update({ status: 'active', updated_at: new Date().toISOString() })
      .eq('id', id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

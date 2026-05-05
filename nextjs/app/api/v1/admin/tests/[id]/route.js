import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const { data, error } = await supabase
      .from('tests')
      .select(`
        id, title, description, status, timer_enabled, time_limit_minutes,
        disable_copy_paste, tab_switch_monitoring, tab_switch_threshold, tab_switch_action,
        created_at, updated_at, job_profile_id,
        job_profiles(id, title),
        test_questions(
          id, type, question_text, position, points, created_at,
          test_options(id, option_text, is_correct, position)
        )
      `)
      .eq('id', id)
      .single();

    if (error) return Response.json({ error: 'Test not found' }, { status: 404 });

    // Sort questions and options by position
    if (data.test_questions) {
      data.test_questions.sort((a, b) => a.position - b.position);
      data.test_questions.forEach(q => {
        if (q.test_options) q.test_options.sort((a, b) => a.position - b.position);
      });
    }

    return Response.json({ test: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { user } = await requireAdmin(request);
    const { id } = await params;
    const body = await request.json();

    const { data: existing } = await supabase.from('tests').select('status').eq('id', id).single();
    if (!existing) return Response.json({ error: 'Test not found' }, { status: 404 });

    const INTEGRITY_KEYS = ['disable_copy_paste', 'tab_switch_monitoring', 'tab_switch_threshold', 'tab_switch_action'];
    const allowed = ['title', 'description', 'job_profile_id', 'timer_enabled', 'time_limit_minutes', 'status', ...INTEGRITY_KEYS];
    const updates = { updated_at: new Date().toISOString() };

    // Validate threshold if provided
    if ('tab_switch_threshold' in body) {
      const t = parseInt(body.tab_switch_threshold);
      if (isNaN(t) || t < 1 || t > 10) {
        return Response.json({ error: 'tab_switch_threshold must be a whole number between 1 and 10' }, { status: 400 });
      }
    }

    // Prevent changing timer or integrity settings when published
    const lockedKeys = ['timer_enabled', 'time_limit_minutes', ...INTEGRITY_KEYS];
    if (existing.status === 'published' && lockedKeys.some(k => k in body)) {
      return Response.json({ error: 'Integrity settings cannot be changed while the test is published' }, { status: 409 });
    }

    for (const key of allowed) {
      if (key in body) {
        if (key === 'title') updates.title = body.title?.trim();
        else if (key === 'description') updates.description = body.description?.trim() || null;
        else if (key === 'time_limit_minutes') updates.time_limit_minutes = parseInt(body.time_limit_minutes) || 30;
        else if (key === 'tab_switch_threshold') updates.tab_switch_threshold = parseInt(body.tab_switch_threshold);
        else if (key === 'tab_switch_action') updates.tab_switch_action = ['flag', 'auto_submit'].includes(body.tab_switch_action) ? body.tab_switch_action : 'flag';
        else updates[key] = body[key];
      }
    }

    const { data, error } = await supabase.from('tests').update(updates).eq('id', id).select().single();
    if (error) throw error;

    await auditLog({ performedBy: user.id, action: 'test.update', details: { test_id: id, updates: Object.keys(updates) } });

    return Response.json({ test: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { user } = await requireAdmin(request);
    const { id } = await params;

    const { error } = await supabase.from('tests').delete().eq('id', id);
    if (error) throw error;

    await auditLog({ performedBy: user.id, action: 'test.delete', details: { test_id: id } });

    return Response.json({ message: 'Test deleted' });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

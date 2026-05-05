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
        id, title, description, status, timer_enabled, time_limit_minutes, allow_copy_paste,
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

    const allowed = ['title', 'description', 'job_profile_id', 'timer_enabled', 'time_limit_minutes', 'allow_copy_paste', 'status'];
    const updates = { updated_at: new Date().toISOString() };

    for (const key of allowed) {
      if (key in body) {
        if (key === 'title') updates.title = body.title?.trim();
        else if (key === 'description') updates.description = body.description?.trim() || null;
        else if (key === 'time_limit_minutes') updates.time_limit_minutes = parseInt(body.time_limit_minutes) || 30;
        else updates[key] = body[key];
      }
    }

    // Prevent changing timer settings when published
    if (existing.status === 'published' && ('timer_enabled' in body || 'time_limit_minutes' in body)) {
      return Response.json({ error: 'Cannot change timer settings on a published test' }, { status: 409 });
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

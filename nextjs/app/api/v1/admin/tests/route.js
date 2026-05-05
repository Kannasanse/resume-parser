import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const page   = parseInt(searchParams.get('page') || '1');
    const limit  = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('tests')
      .select('id, title, description, status, timer_enabled, time_limit_minutes, disable_copy_paste, tab_switch_monitoring, tab_switch_threshold, tab_switch_action, created_at, updated_at, job_profile_id, job_profiles(title)', { count: 'exact' });

    if (search) {
      query = query.ilike('title', `%${search}%`);
    }
    if (status) {
      query = query.eq('status', status);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Attach question count and link count per test
    const testIds = (data || []).map(t => t.id);
    let qCounts = {}, lCounts = {};
    if (testIds.length) {
      const [{ data: qRows }, { data: lRows }] = await Promise.all([
        supabase.from('test_questions').select('test_id').in('test_id', testIds),
        supabase.from('test_links').select('test_id').in('test_id', testIds),
      ]);
      for (const r of qRows || []) qCounts[r.test_id] = (qCounts[r.test_id] || 0) + 1;
      for (const r of lRows || []) lCounts[r.test_id] = (lCounts[r.test_id] || 0) + 1;
    }

    return Response.json({
      tests: (data || []).map(t => ({
        ...t,
        question_count: qCounts[t.id] || 0,
        link_count: lCounts[t.id] || 0,
      })),
      total: count || 0,
      page,
      limit,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const { user } = await requireAdmin(request);
    const body = await request.json();
    const {
      title, description, job_profile_id, timer_enabled, time_limit_minutes,
      disable_copy_paste, tab_switch_monitoring, tab_switch_threshold, tab_switch_action,
    } = body;

    if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 });

    const threshold = parseInt(tab_switch_threshold);
    if (tab_switch_threshold !== undefined && (isNaN(threshold) || threshold < 1 || threshold > 10)) {
      return Response.json({ error: 'tab_switch_threshold must be a whole number between 1 and 10' }, { status: 400 });
    }

    const { data, error } = await supabase
      .from('tests')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        job_profile_id: job_profile_id || null,
        timer_enabled: !!timer_enabled,
        time_limit_minutes: parseInt(time_limit_minutes) || 30,
        disable_copy_paste: !!disable_copy_paste,
        tab_switch_monitoring: !!tab_switch_monitoring,
        tab_switch_threshold: threshold || 3,
        tab_switch_action: ['flag', 'auto_submit'].includes(tab_switch_action) ? tab_switch_action : 'flag',
        status: 'draft',
        created_by: user.id,
      })
      .select()
      .single();

    if (error) throw error;

    await auditLog({ performedBy: user.id, action: 'test.create', details: { test_id: data.id, title: data.title } });

    return Response.json({ test: data }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

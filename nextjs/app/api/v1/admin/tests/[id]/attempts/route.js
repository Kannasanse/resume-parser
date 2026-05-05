import supabase from '@/lib/supabase.js';
import { requireAdmin } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await requireAdmin(request);
    const { id: test_id } = await params;

    const { searchParams } = new URL(request.url);
    const page  = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = (page - 1) * limit;

    // Get all links for this test, then their attempts
    const { data: links } = await supabase
      .from('test_links')
      .select('id, recipient_email, recipient_name, token, status')
      .eq('test_id', test_id);

    if (!links?.length) return Response.json({ attempts: [], total: 0, page, limit });

    const linkIds = links.map(l => l.id);
    const linkMap = Object.fromEntries(links.map(l => [l.id, l]));

    const { data: attempts, error, count } = await supabase
      .from('test_attempts')
      .select('id, test_link_id, started_at, submitted_at, auto_submitted, score, max_score, graded_at, time_remaining_seconds', { count: 'exact' })
      .in('test_link_id', linkIds)
      .not('submitted_at', 'is', null)
      .order('submitted_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Count integrity events per attempt
    const attemptIds = (attempts || []).map(a => a.id);
    let integrityMap = {};
    if (attemptIds.length) {
      const { data: events } = await supabase
        .from('test_integrity_events')
        .select('attempt_id, event_type')
        .in('attempt_id', attemptIds);
      for (const e of events || []) {
        if (!integrityMap[e.attempt_id]) integrityMap[e.attempt_id] = {};
        integrityMap[e.attempt_id][e.event_type] = (integrityMap[e.attempt_id][e.event_type] || 0) + 1;
      }
    }

    return Response.json({
      attempts: (attempts || []).map(a => ({
        ...a,
        link: linkMap[a.test_link_id],
        integrity_summary: integrityMap[a.id] || {},
        integrity_flags: Object.values(integrityMap[a.id] || {}).reduce((s, n) => s + n, 0),
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

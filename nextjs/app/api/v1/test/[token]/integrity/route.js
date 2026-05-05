import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

const VALID_EVENTS = ['tab_switch', 'copy_attempt', 'paste_attempt', 'right_click', 'focus_lost', 'focus_regained', 'visibility_change'];

export async function POST(request, { params }) {
  try {
    const { token } = await params;
    const { attempt_id, event_type } = await request.json();

    if (!VALID_EVENTS.includes(event_type)) {
      return Response.json({ error: 'Invalid event_type' }, { status: 400 });
    }

    // Verify token → link → attempt
    const { data: link } = await supabase
      .from('test_links')
      .select('id')
      .eq('token', token)
      .single();
    if (!link) return Response.json({ error: 'Invalid token' }, { status: 404 });

    const { data: attempt } = await supabase
      .from('test_attempts')
      .select('id')
      .eq('id', attempt_id)
      .eq('test_link_id', link.id)
      .single();
    if (!attempt) return Response.json({ error: 'Attempt not found' }, { status: 404 });

    await supabase.from('test_integrity_events').insert({ attempt_id, event_type });

    return Response.json({ message: 'Logged' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

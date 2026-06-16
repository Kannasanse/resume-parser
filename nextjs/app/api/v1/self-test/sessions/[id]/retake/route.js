import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function POST(request, { params }) {
  try {
    const { user } = await requireUser(request);
    const { id } = await params;

    const { data: session, error } = await supabase
      .from('self_test_sessions')
      .select('id, user_id, input_type, input_data, difficulty, timer_minutes, question_types, jd_skills')
      .eq('id', id)
      .single();

    if (error || !session) return Response.json({ error: 'Session not found' }, { status: 404 });
    if (session.user_id !== user.id) return Response.json({ error: 'Forbidden' }, { status: 403 });

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;

    const body = {
      input_type:     session.input_type,
      input_data:     session.input_data || '',
      difficulty:     session.difficulty,
      timer_minutes:  session.timer_minutes,
      question_types: session.question_types || ['mcq'],
    };
    if (session.input_type === 'jd' && session.jd_skills) {
      body.jd_skills = session.jd_skills;
    }

    const resp = await fetch(`${baseUrl}/api/v1/self-test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: request.headers.get('cookie') || '',
      },
      body: JSON.stringify(body),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return Response.json({ error: data.error || 'Failed to create session' }, { status: resp.status });
    }

    return Response.json({ sessionId: data.session.id });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

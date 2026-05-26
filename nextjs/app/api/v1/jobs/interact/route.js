import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

const VALID_ACTIONS = new Set(['viewed', 'applied', 'saved', 'dismissed']);

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const body = await request.json().catch(() => ({}));
    const { job_id, job_title, company, action, cache_key } = body;

    if (!job_id) {
      return NextResponse.json({ error: 'job_id is required.' }, { status: 400 });
    }
    if (!VALID_ACTIONS.has(action)) {
      return NextResponse.json({ error: `action must be one of: ${[...VALID_ACTIONS].join(', ')}` }, { status: 400 });
    }

    await supabase.from('user_job_interactions').insert({
      user_id:   user.id,
      job_id,
      job_title: job_title ?? '',
      company:   company ?? '',
      action,
      cache_key: cache_key ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response || err instanceof NextResponse) return err;
    console.error('[jobs/interact POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

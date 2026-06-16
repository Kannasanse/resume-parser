import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

// POST /api/v1/skills/analytics
// Body: { skillId, eventType, context }
export async function POST(request) {
  let user;
  try {
    ({ user } = await requireUser(request));
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { skillId, eventType, context } = await request.json().catch(() => ({}));

    // Fire-and-forget insert
    try {
      await supabase.from('skill_analytics').insert({
        skill_id: skillId,
        event_type: eventType,
        user_id: user.id,
        context: context ?? null,
      });
    } catch (_) {
      // swallow
    }

    // Increment counters via RPC
    if (eventType === 'select') {
      try {
        await supabase.rpc('increment_skill_counter', {
          skill_id: skillId,
          column_name: 'selection_count',
        });
      } catch (_) {
        // swallow
      }
    } else if (eventType === 'search') {
      try {
        await supabase.rpc('increment_skill_counter', {
          skill_id: skillId,
          column_name: 'search_count',
        });
      } catch (_) {
        // swallow
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[skills/analytics POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

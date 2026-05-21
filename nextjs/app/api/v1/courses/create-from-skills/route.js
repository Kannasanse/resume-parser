import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { selectedSkills } = await request.json();

    if (!selectedSkills?.length) {
      return NextResponse.json({ error: 'No skills selected' }, { status: 400 });
    }

    const { data: session, error } = await supabase
      .from('career_map_sessions')
      .insert({
        user_id: user.id,
        creation_mode: 'skills',
        selected_skills: selectedSkills,
      })
      .select('id')
      .single();

    if (error) throw error;

    return NextResponse.json({ sessionId: session.id });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('create-from-skills error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

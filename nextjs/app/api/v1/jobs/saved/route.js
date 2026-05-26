import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data } = await supabase
      .from('user_job_interactions')
      .select('job_id, job_title, company, created_at')
      .eq('user_id', user.id)
      .eq('action', 'saved')
      .order('created_at', { ascending: false });

    return NextResponse.json({ saved: data ?? [] });
  } catch (err) {
    if (err instanceof Response || err instanceof NextResponse) return err;
    console.error('[jobs/saved GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

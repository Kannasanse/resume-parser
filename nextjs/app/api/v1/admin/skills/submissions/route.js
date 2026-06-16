import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

async function getAdminUser(request) {
  let user;
  try {
    ({ user } = await requireUser(request));
  } catch (err) {
    if (err instanceof Response) throw err;
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
  }

  return { user, profile };
}

// GET /api/v1/admin/skills/submissions?status=pending
export async function GET(request) {
  try {
    await getAdminUser(request);
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';

    let query = supabase
      .from('user_submitted_skills')
      .select('*')
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    return NextResponse.json({ submissions: data || [] });
  } catch (err) {
    if (err instanceof Response || err instanceof NextResponse) return err;
    console.error('[admin/skills/submissions GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PATCH /api/v1/admin/skills/submissions
// Body: { id, status, admin_note, merged_into }
export async function PATCH(request) {
  try {
    const { user } = await getAdminUser(request);
    const body = await request.json().catch(() => ({}));
    const { id, status, admin_note, merged_into } = body;

    if (!id) {
      return NextResponse.json({ error: 'Submission id is required.' }, { status: 400 });
    }

    // If approving, create a new skill from the submission
    if (status === 'approved') {
      const { data: submission } = await supabase
        .from('user_submitted_skills')
        .select('name')
        .eq('id', id)
        .single();

      if (submission?.name) {
        const slug = submission.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        await supabase.from('skills').insert({
          name: submission.name,
          slug,
          source: 'user_submitted',
          is_verified: false,
          category: 'Other',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }

    const { error } = await supabase
      .from('user_submitted_skills')
      .update({
        status,
        admin_note: admin_note ?? null,
        merged_into: merged_into ?? null,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
      })
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response || err instanceof NextResponse) return err;
    console.error('[admin/skills/submissions PATCH]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

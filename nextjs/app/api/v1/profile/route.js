import { requireUser } from '@/lib/auth-helpers.js';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function makeAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET(request) {
  try {
    const { user: effectiveUser } = await requireUser(request);

    const supabase = makeAdminClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status, avatar_url, created_at, last_login_at, headline, city, country')
      .eq('id', effectiveUser.id)
      .single();

    if (error) return Response.json({ error: error.message }, { status: 500 });
    return Response.json({ data });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function PATCH(request) {
  try {
    const { user: effectiveUser } = await requireUser(request);

    const body = await request.json();
    const firstName = (body.first_name || '').trim();
    const lastName  = (body.last_name  || '').trim();
    const headline  = (body.headline   || '').trim() || null;
    const city      = (body.city       || '').trim() || null;
    const country   = (body.country    || '').trim() || null;

    if (!firstName) return Response.json({ error: 'First name is required.' }, { status: 400 });

    const supabase = makeAdminClient();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ first_name: firstName, last_name: lastName, headline, city, country })
      .eq('id', effectiveUser.id);

    if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

    // Sync first/last name to auth user_metadata
    await supabase.auth.admin.updateUserById(effectiveUser.id, {
      user_metadata: { first_name: firstName, last_name: lastName },
    });

    return Response.json({ success: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

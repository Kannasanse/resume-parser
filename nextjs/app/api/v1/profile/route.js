import { getAuthUser } from '@/lib/authUtils.js';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function makeAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export async function GET() {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const supabase = makeAdminClient();
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role, status, avatar_url, created_at, last_login_at')
    .eq('id', user.id)
    .single();

  if (error) return Response.json({ error: error.message }, { status: 500 });
  return Response.json({ data });
}

export async function PATCH(req) {
  const user = await getAuthUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const firstName = (body.first_name || '').trim();
  const lastName  = (body.last_name  || '').trim();

  if (!firstName) return Response.json({ error: 'First name is required.' }, { status: 400 });

  const supabase = makeAdminClient();

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ first_name: firstName, last_name: lastName })
    .eq('id', user.id);

  if (profileError) return Response.json({ error: profileError.message }, { status: 500 });

  // Sync to auth user_metadata
  const { error: metaError } = await supabase.auth.admin.updateUserById(user.id, {
    user_metadata: { ...user.user_metadata, first_name: firstName, last_name: lastName },
  });

  if (metaError) return Response.json({ error: metaError.message }, { status: 500 });

  return Response.json({ success: true });
}

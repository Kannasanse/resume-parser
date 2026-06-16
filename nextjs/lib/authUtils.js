import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import supabaseAdmin from './supabase.js';

export async function getAuthUser() {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Impersonation: if admin has set proxy_uid cookie, return the proxied user instead
  const proxyUid = cookieStore.get('proxy_uid')?.value;
  if (proxyUid) {
    const { data: realProfile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (realProfile?.role === 'admin') {
      const { data: proxyProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, email, status')
        .eq('id', proxyUid)
        .single();
      if (proxyProfile && proxyProfile.status !== 'deactivated') {
        return { id: proxyUid, email: proxyProfile.email };
      }
    }
  }

  return user;
}

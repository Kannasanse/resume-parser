import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import supabaseAdmin from '@/lib/supabase.js';

export async function GET(request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') || '';

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll() { return cookieStore.getAll(); },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const { data: { user } } = await supabase.auth.getUser();

      // Stamp last_login_at
      if (user?.id) {
        await supabaseAdmin
          .from('profiles')
          .update({ last_login_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('id', user.id);
      }

      // If caller specified a redirect (e.g. /reset-password), honour it
      if (next && next.startsWith('/')) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise route by role
      const role = user?.user_metadata?.role || 'user';
      return NextResponse.redirect(`${origin}${role === 'admin' ? '/resumes' : '/builder'}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth-callback-failed`);
}

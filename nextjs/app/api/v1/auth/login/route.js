import { createServerClient } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import { checkLoginRateLimit, recordFailedLogin, clearFailedLogins } from '@/lib/auth-helpers.js';
import supabaseAdmin from '@/lib/supabase.js';

export async function POST(request) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    let supabaseResponse = NextResponse.next({ request });
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: (cookiesToSet) => {
            cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Look up user profile for rate limiting (by email)
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, failed_login_attempts, locked_until, status')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (profile) {
      const rateCheck = await checkLoginRateLimit(profile.id);
      if (rateCheck.blocked) {
        return NextResponse.json(
          { error: `Account locked. Try again in ${rateCheck.minutesLeft} minute${rateCheck.minutesLeft !== 1 ? 's' : ''}.`, code: 'LOCKED_OUT', minutesLeft: rateCheck.minutesLeft },
          { status: 429 }
        );
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      // Record failed attempt if user exists
      if (profile) await recordFailedLogin(profile.id);

      if (error.message?.toLowerCase().includes('email not confirmed')) {
        return NextResponse.json({ error: 'Please verify your email before logging in.', code: 'EMAIL_NOT_VERIFIED' }, { status: 403 });
      }
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const user = data.user;

    // Clear failed logins on success
    if (profile) await clearFailedLogins(profile.id);

    // Check account status
    if (profile?.status === 'deactivated') {
      await supabase.auth.signOut();
      return NextResponse.json({ error: 'This account has been deactivated.' }, { status: 403 });
    }

    const isAdmin = user.user_metadata?.role === 'admin' || profile?.role === 'admin';

    const successResponse = NextResponse.json({ ok: true, isAdmin });
    // Copy session cookies from the SSR client response
    supabaseResponse.cookies.getAll().forEach(cookie => {
      successResponse.cookies.set(cookie.name, cookie.value, cookie);
    });
    return successResponse;
  } catch (err) {
    console.error('[login] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

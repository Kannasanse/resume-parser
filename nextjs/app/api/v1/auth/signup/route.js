import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { sendVerificationEmail } from '@/lib/email.js';

export async function POST(request) {
  try {
    const { firstName, lastName, email, password } = await request.json();

    // Basic server-side validation
    if (!firstName?.trim() || !lastName?.trim() || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: 'Invalid email address.' }, { status: 400 });
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password does not meet requirements.' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: 'An account with this email already exists.', code: 'EMAIL_EXISTS' }, { status: 409 });
    }

    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

    // Create user with service-role client (email confirmation required)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password,
      email_confirm: false,
      user_metadata: {
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        role: 'user',
      },
      options: {
        emailRedirectTo: `${APP_URL}/auth/callback`,
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes('already registered') ||
          authError.message?.toLowerCase().includes('already exists')) {
        return NextResponse.json({ error: 'An account with this email already exists.', code: 'EMAIL_EXISTS' }, { status: 409 });
      }
      console.error('[signup] auth error:', authError);
      return NextResponse.json({ error: 'Could not create account. Please try again.' }, { status: 500 });
    }

    const userId = authData.user.id;

    // Upsert profile row (trigger may create it, but ensure first/last name populated)
    await supabase.from('profiles').upsert({
      id: userId,
      email: email.toLowerCase(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role: 'user',
      status: 'pending',
      updated_at: new Date().toISOString(),
    });

    // Generate confirmation link and send email
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'signup',
      email: email.toLowerCase(),
      options: { redirectTo: `${APP_URL}/auth/callback` },
    });

    if (!linkError && linkData?.properties?.action_link) {
      await sendVerificationEmail({ to: email, confirmationUrl: linkData.properties.action_link }).catch(console.error);
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error('[signup] unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

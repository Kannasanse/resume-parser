import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

export async function POST(request) {
  try {
    const { token, firstName, lastName, password } = await request.json();

    if (!token || !firstName?.trim() || !lastName?.trim() || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      return NextResponse.json({ error: 'Password does not meet requirements.' }, { status: 400 });
    }

    // Validate token
    const { data: invite, error: inviteError } = await supabase
      .from('invite_tokens')
      .select('id, email, role, used_at, expires_at')
      .eq('token', token)
      .maybeSingle();

    if (inviteError || !invite) {
      return NextResponse.json({ error: 'Invalid invitation.', code: 'INVALID' }, { status: 404 });
    }
    if (invite.used_at) {
      return NextResponse.json({ error: 'Invitation already used.', code: 'TOKEN_USED' }, { status: 410 });
    }
    if (new Date(invite.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Invitation has expired.', code: 'TOKEN_EXPIRED' }, { status: 410 });
    }

    // Check if account already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', invite.email.toLowerCase())
      .maybeSingle();

    let userId;

    if (existingProfile) {
      userId = existingProfile.id;
      // Update password
      const { error: pwError } = await supabase.auth.admin.updateUserById(userId, { password });
      if (pwError) throw pwError;
    } else {
      // Create new user (pre-confirmed — invited users are trusted)
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: invite.email.toLowerCase(),
        password,
        email_confirm: true,
        user_metadata: {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          role: invite.role,
        },
      });
      if (authError) throw authError;
      userId = authData.user.id;
    }

    // Update profile
    await supabase.from('profiles').upsert({
      id: userId,
      email: invite.email.toLowerCase(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      role: invite.role,
      status: 'active',
      updated_at: new Date().toISOString(),
    });

    // Also sync role to auth user_metadata
    await supabase.auth.admin.updateUserById(userId, {
      user_metadata: { role: invite.role, first_name: firstName.trim(), last_name: lastName.trim() },
    });

    // Mark token used
    await supabase
      .from('invite_tokens')
      .update({ used_at: new Date().toISOString(), accepted_by: userId })
      .eq('id', invite.id);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[accept-invite] error:', err);
    return NextResponse.json({ error: 'Could not complete setup. Please try again.' }, { status: 500 });
  }
}

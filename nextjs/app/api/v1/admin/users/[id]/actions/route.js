import { NextResponse } from 'next/server';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { sendInviteEmail, sendPasswordResetEmail } from '@/lib/email.js';
import { randomUUID } from 'crypto';
import { createClient } from '@supabase/supabase-js';

function adminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SECRET_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// GET /api/v1/admin/users/[id]/actions — fetch auth event log for user
export async function GET(request, { params }) {
  try {
    await requireAdmin(request);
    const { id } = await params;

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status, avatar_url, created_at, last_login_at, failed_login_attempts, locked_until')
      .eq('id', id)
      .single();

    if (!profile) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    // Auth events from audit_log
    const { data: events } = await supabase
      .from('audit_log')
      .select('id, action, details, created_at, performed_by')
      .eq('target_user_id', id)
      .order('created_at', { ascending: false })
      .limit(50);

    // Pending invite tokens for this user
    const { data: invites } = await supabase
      .from('invite_tokens')
      .select('id, created_at, expires_at, used_at, status')
      .eq('email', profile.email)
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({ profile, events: events || [], invites: invites || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/v1/admin/users/[id]/actions — resend invite or password reset
export async function POST(request, { params }) {
  try {
    const { user: adminUser, profile: adminProfile } = await requireAdmin(request);
    const { id } = await params;
    const { action } = await request.json();

    const { data: target } = await supabase
      .from('profiles')
      .select('email, first_name, last_name, status')
      .eq('id', id)
      .single();

    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const inviterName = [adminProfile.first_name, adminProfile.last_name].filter(Boolean).join(' ') || adminProfile.email;

    if (action === 'resend_invite') {
      // Cancel previous pending invites for this email
      await supabase
        .from('invite_tokens')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('email', target.email)
        .eq('status', 'pending');

      const token = randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      await supabase.from('invite_tokens').insert({
        token,
        email: target.email,
        role: 'user',
        invited_by: adminUser.id,
        expires_at: expiresAt,
        status: 'pending',
      });

      await sendInviteEmail({ to: target.email, token, role: 'user', invitedBy: inviterName });

      await auditLog({
        performedBy: adminUser.id,
        action: 'invite_resent',
        targetUserId: id,
        targetEmail: target.email,
      });

      return NextResponse.json({ ok: true, message: 'Invitation resent.' });
    }

    if (action === 'send_password_reset') {
      const sc = adminClient();
      const siteUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://proflect-evo.vercel.app';
      const redirectTo = `${siteUrl}/auth/callback?next=/reset-password`;

      const { data: linkData, error: linkError } = await sc.auth.admin.generateLink({
        type: 'recovery',
        email: target.email,
        options: { redirectTo },
      });

      if (linkError) throw linkError;

      const resetUrl = linkData?.properties?.action_link;
      if (!resetUrl) throw new Error('Failed to generate reset link.');

      await sendPasswordResetEmail({ to: target.email, resetUrl });

      await auditLog({
        performedBy: adminUser.id,
        action: 'password_reset_sent',
        targetUserId: id,
        targetEmail: target.email,
      });

      return NextResponse.json({ ok: true, message: 'Password reset email sent.' });
    }

    return NextResponse.json({ error: 'Unknown action.' }, { status: 400 });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[admin/users/actions POST]', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

// PATCH /api/v1/admin/users/[id]/actions — update first/last name
export async function PATCH(request, { params }) {
  try {
    const { user: adminUser } = await requireAdmin(request);
    const { id } = await params;
    const { first_name, last_name } = await request.json();

    if (!first_name?.trim()) return NextResponse.json({ error: 'First name is required.' }, { status: 400 });

    const sc = adminClient();

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ first_name: first_name.trim(), last_name: (last_name || '').trim() })
      .eq('id', id);

    if (profileError) throw profileError;

    await sc.auth.admin.updateUserById(id, {
      user_metadata: { first_name: first_name.trim(), last_name: (last_name || '').trim() },
    });

    const { data: target } = await supabase.from('profiles').select('email').eq('id', id).single();

    await auditLog({
      performedBy: adminUser.id,
      action: 'user_name_updated',
      targetUserId: id,
      targetEmail: target?.email,
      details: { first_name: first_name.trim(), last_name: (last_name || '').trim() },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[admin/users/actions PATCH]', err);
    return NextResponse.json({ error: err.message || 'Internal server error.' }, { status: 500 });
  }
}

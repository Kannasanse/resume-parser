import { NextResponse } from 'next/server';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { sendInviteEmail } from '@/lib/email.js';
import { randomUUID } from 'crypto';

// POST /api/v1/admin/invite — send invites
export async function POST(request) {
  try {
    const { user: adminUser, profile: adminProfile } = await requireAdmin(request);
    const { emails, role = 'user' } = await request.json();

    if (!Array.isArray(emails) || emails.length === 0) {
      return NextResponse.json({ error: 'At least one email is required.' }, { status: 400 });
    }
    if (!['user', 'admin'].includes(role)) {
      return NextResponse.json({ error: 'Invalid role.' }, { status: 400 });
    }

    const validEmails = emails
      .map(e => e.trim().toLowerCase())
      .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e));

    if (validEmails.length === 0) {
      return NextResponse.json({ error: 'No valid email addresses provided.' }, { status: 400 });
    }

    const results = [];
    const inviterName = [adminProfile.first_name, adminProfile.last_name].filter(Boolean).join(' ') || adminProfile.email;
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    for (const email of validEmails) {
      const token = randomUUID();
      const { error: insertError } = await supabase.from('invite_tokens').insert({
        token,
        email,
        role,
        invited_by: adminUser.id,
        expires_at: expiresAt,
      });

      if (insertError) {
        results.push({ email, ok: false, error: 'Failed to create invitation.' });
        continue;
      }

      try {
        await sendInviteEmail({ to: email, token, role, invitedBy: inviterName });
        results.push({ email, ok: true });
      } catch (emailErr) {
        console.error('[invite] email send error for', email, emailErr);
        results.push({ email, ok: true, warning: 'Invite created but email delivery failed.' });
      }

      await auditLog({
        performedBy: adminUser.id,
        action: 'user_invited',
        targetEmail: email,
        details: { role },
      });
    }

    return NextResponse.json({ results });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[admin/invite POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// GET /api/v1/admin/invite — list pending invites
export async function GET(request) {
  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10));

    const { data, count, error } = await supabase
      .from('invite_tokens')
      .select('id, email, role, expires_at, used_at, created_at', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;
    return NextResponse.json({ invites: data || [], total: count || 0, page, limit });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE /api/v1/admin/invite?id=xxx — cancel pending invite
export async function DELETE(request) {
  try {
    const { user: adminUser } = await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Invite ID required.' }, { status: 400 });

    const { data: invite } = await supabase
      .from('invite_tokens')
      .select('email, used_at')
      .eq('id', id)
      .single();

    if (!invite) return NextResponse.json({ error: 'Invite not found.' }, { status: 404 });
    if (invite.used_at) return NextResponse.json({ error: 'Cannot cancel a used invitation.' }, { status: 400 });

    const { error } = await supabase.from('invite_tokens').delete().eq('id', id);
    if (error) throw error;

    await auditLog({
      performedBy: adminUser.id,
      action: 'invite_cancelled',
      targetEmail: invite.email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

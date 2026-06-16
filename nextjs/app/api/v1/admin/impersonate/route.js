import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

const COOKIE = 'proxy_uid';
const cookieOpts = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/',
  maxAge: 60 * 60 * 8, // 8 hours
};

// GET /api/v1/admin/impersonate — return active proxy status
export async function GET(request) {
  try {
    await requireAdmin(request);
  } catch {
    return NextResponse.json({ active: false });
  }

  const uid = request.cookies.get(COOKIE)?.value;
  if (!uid) return NextResponse.json({ active: false });

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email')
    .eq('id', uid)
    .single();

  if (!profile) {
    const res = NextResponse.json({ active: false });
    res.cookies.set(COOKIE, '', { ...cookieOpts, maxAge: 0 });
    return res;
  }

  return NextResponse.json({
    active: true,
    user: {
      id: profile.id,
      name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email,
      email: profile.email,
    },
  });
}

// POST /api/v1/admin/impersonate — start impersonation { userId }
export async function POST(request) {
  try {
    const { user: adminUser, profile: adminProfile } = await requireAdmin(request);

    const { userId } = await request.json();
    if (!userId) return NextResponse.json({ error: 'userId required' }, { status: 400 });

    const { data: target } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, role, status')
      .eq('id', userId)
      .single();

    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (target.role === 'admin') {
      return NextResponse.json({ error: 'Cannot impersonate another admin' }, { status: 403 });
    }
    if (target.status === 'deactivated') {
      return NextResponse.json({ error: 'Cannot impersonate a deactivated user' }, { status: 403 });
    }

    await auditLog({
      performedBy: adminUser.id,
      action: 'impersonate_start',
      targetUserId: userId,
      targetEmail: target.email,
      details: { admin_email: adminProfile.email },
    });

    const res = NextResponse.json({
      ok: true,
      user: {
        id: target.id,
        name: [target.first_name, target.last_name].filter(Boolean).join(' ') || target.email,
        email: target.email,
      },
    });
    res.cookies.set(COOKIE, userId, cookieOpts);
    return res;
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[impersonate POST]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/v1/admin/impersonate — end impersonation
export async function DELETE(request) {
  try {
    const { user: adminUser } = await requireAdmin(request);

    const uid = request.cookies.get(COOKIE)?.value;
    if (uid) {
      await auditLog({
        performedBy: adminUser.id,
        action: 'impersonate_end',
        targetUserId: uid,
      });
    }

    const res = NextResponse.json({ ok: true });
    res.cookies.set(COOKIE, '', { ...cookieOpts, maxAge: 0 });
    return res;
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[impersonate DELETE]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

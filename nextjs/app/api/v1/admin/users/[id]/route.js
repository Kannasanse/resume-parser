import { NextResponse } from 'next/server';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { sendRoleChangedEmail } from '@/lib/email.js';

// GET /api/v1/admin/users/[id]
export async function GET(request, { params }) {
  try {
    const { profile: adminProfile } = await requireAdmin(request);
    const { id } = await params;

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, status, created_at, last_login_at, failed_login_attempts, locked_until')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    return NextResponse.json({ user: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PATCH /api/v1/admin/users/[id]  — update role, status, unlock
export async function PATCH(request, { params }) {
  try {
    const { user: adminUser, profile: adminProfile } = await requireAdmin(request);
    const { id } = await params;

    const body = await request.json();
    const allowed = ['role', 'status', 'locked_until', 'failed_login_attempts'];
    const updates = {};
    for (const key of allowed) {
      if (key in body) updates[key] = body[key];
    }
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update.' }, { status: 400 });
    }

    // Prevent self-demotion from admin
    if (id === adminUser.id && updates.role && updates.role !== 'admin') {
      return NextResponse.json({ error: 'You cannot remove your own admin role.' }, { status: 400 });
    }

    // Fetch current profile for audit
    const { data: current } = await supabase.from('profiles').select('email, role').eq('id', id).single();
    if (!current) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    updates.updated_at = new Date().toISOString();
    const { error } = await supabase.from('profiles').update(updates).eq('id', id);
    if (error) throw error;

    // Sync role to auth metadata if role changed
    if (updates.role) {
      await supabase.auth.admin.updateUserById(id, { user_metadata: { role: updates.role } });
      await sendRoleChangedEmail({ to: current.email, newRole: updates.role }).catch(console.error);
    }

    // Unlock: also reset failed attempts if unlocking
    if ('locked_until' in updates && updates.locked_until === null) {
      await supabase.from('profiles').update({ failed_login_attempts: 0 }).eq('id', id);
    }

    await auditLog({
      performedBy: adminUser.id,
      action: 'user_updated',
      targetUserId: id,
      targetEmail: current.email,
      details: updates,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[admin/users PATCH]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// DELETE /api/v1/admin/users/[id]
export async function DELETE(request, { params }) {
  try {
    const { user: adminUser, profile: adminProfile } = await requireAdmin(request);
    const { id } = await params;

    if (id === adminUser.id) {
      return NextResponse.json({ error: 'You cannot delete your own account.' }, { status: 400 });
    }

    const { data: target } = await supabase.from('profiles').select('email').eq('id', id).single();
    if (!target) return NextResponse.json({ error: 'User not found.' }, { status: 404 });

    const { error } = await supabase.auth.admin.deleteUser(id);
    if (error) throw error;

    await auditLog({
      performedBy: adminUser.id,
      action: 'user_deleted',
      targetUserId: id,
      targetEmail: target.email,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[admin/users DELETE]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

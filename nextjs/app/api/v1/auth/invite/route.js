import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';

// GET /api/v1/auth/invite?token=xxx  — validate an invite token (public)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');

  if (!token) {
    return NextResponse.json({ error: 'Token is required.', code: 'INVALID' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('invite_tokens')
    .select('email, role, used_at, expires_at')
    .eq('token', token)
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ error: 'Invalid invitation.', code: 'INVALID' }, { status: 404 });
  }

  if (data.used_at) {
    return NextResponse.json({ error: 'Invitation already used.', code: 'TOKEN_USED' }, { status: 410 });
  }

  if (new Date(data.expires_at) < new Date()) {
    return NextResponse.json({ error: 'Invitation has expired.', code: 'TOKEN_EXPIRED' }, { status: 410 });
  }

  return NextResponse.json({ email: data.email, role: data.role });
}

import { NextResponse } from 'next/server';
import { requireUser } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { sendCreditRequestNotification } from '@/lib/email.js';

// POST /api/v1/credits/request — submit credit request
export async function POST(request) {
  try {
    const { user } = await requireUser(request);
    const { amount_requested = 10, reason } = await request.json();

    if (amount_requested < 1 || amount_requested > 100) {
      return NextResponse.json({ error: 'Amount must be between 1 and 100.' }, { status: 400 });
    }

    // Check for pending request already
    const { data: existing } = await supabase
      .from('credit_requests')
      .select('id')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .single();

    if (existing) {
      return NextResponse.json({ error: 'You already have a pending credit request.' }, { status: 409 });
    }

    const { data, error } = await supabase.from('credit_requests').insert({
      user_id: user.id,
      amount_requested,
      reason: reason?.trim() || null,
    }).select().single();

    if (error) throw error;

    // Notify all admins by email (fire-and-forget)
    const { data: requesterProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', user.id)
      .single();

    const { data: admins } = await supabase
      .from('profiles')
      .select('email')
      .eq('role', 'admin');

    if (admins?.length && requesterProfile) {
      const userName = [requesterProfile.first_name, requesterProfile.last_name].filter(Boolean).join(' ') || requesterProfile.email;
      const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/credits`;
      await Promise.allSettled(
        admins.map(a => sendCreditRequestNotification({
          to: a.email,
          userName,
          userEmail: requesterProfile.email,
          amount: amount_requested,
          reason,
          reviewUrl,
        }))
      );
    }

    return NextResponse.json({ ok: true, request: data });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/v1/credits/request — list user's own requests
export async function GET(request) {
  try {
    const { user } = await requireUser(request);
    const { data } = await supabase
      .from('credit_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    return NextResponse.json({ requests: data || [] });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

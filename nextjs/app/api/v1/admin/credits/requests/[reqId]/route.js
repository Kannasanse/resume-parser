import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';
import { grantCredits } from '@/lib/credits.js';

// POST /api/v1/admin/credits/requests/[reqId] — approve or reject
export async function POST(request, { params }) {
  try {
    const { user: adminUser } = await requireAdmin(request);
    const { reqId } = await params;
    const { action, admin_notes, amount_override } = await request.json();

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'action must be approve or reject' }, { status: 400 });
    }

    const { data: req } = await supabase
      .from('credit_requests')
      .select('*')
      .eq('id', reqId)
      .single();

    if (!req) return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    if (req.status !== 'pending') return NextResponse.json({ error: 'Request already reviewed' }, { status: 409 });

    const now = new Date().toISOString();

    if (action === 'approve') {
      const amount = amount_override || req.amount_requested;
      await grantCredits(req.user_id, amount, 'request_approved', `Credits from approved request (#${reqId.slice(0, 8)})`);
      await supabase.from('credit_requests').update({
        status: 'approved', reviewed_by: adminUser.id, reviewed_at: now,
        admin_notes: admin_notes || null, amount_requested: amount, updated_at: now,
      }).eq('id', reqId);
    } else {
      await supabase.from('credit_requests').update({
        status: 'rejected', reviewed_by: adminUser.id, reviewed_at: now,
        admin_notes: admin_notes || null, updated_at: now,
      }).eq('id', reqId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof Response) return err;
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

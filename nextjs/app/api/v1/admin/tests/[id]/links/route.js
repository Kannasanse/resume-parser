import { randomBytes } from 'crypto';
import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    await requireAdmin(request);
    const { id: test_id } = await params;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || '';
    const page   = parseInt(searchParams.get('page') || '1');
    const limit  = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
    const offset = (page - 1) * limit;

    let query = supabase
      .from('test_links')
      .select('id, recipient_email, recipient_name, token, status, expires_at, created_at, test_attempts(submitted_at, score, max_score)', { count: 'exact' })
      .eq('test_id', test_id);

    if (status) query = query.eq('status', status);

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    return Response.json({ links: data || [], total: count || 0, page, limit });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(request, { params }) {
  try {
    const { user } = await requireAdmin(request);
    const { id: test_id } = await params;
    const body = await request.json();

    // Verify test is published
    const { data: test } = await supabase.from('tests').select('status, title').eq('id', test_id).single();
    if (!test) return Response.json({ error: 'Test not found' }, { status: 404 });
    if (test.status !== 'published') {
      return Response.json({ error: 'Test must be published before generating links' }, { status: 409 });
    }

    // Accept single { email, name } or array of same
    const recipients = Array.isArray(body.recipients)
      ? body.recipients
      : [{ email: body.email, name: body.name || '' }];

    if (!recipients.length) return Response.json({ error: 'At least one recipient is required' }, { status: 400 });

    const expiresAt = body.expires_at
      ? new Date(body.expires_at).toISOString()
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    const rows = recipients
      .filter(r => r.email?.includes('@'))
      .map(r => ({
        test_id,
        recipient_email: r.email.trim().toLowerCase(),
        recipient_name: (r.name || '').trim(),
        token: randomBytes(24).toString('hex'),
        expires_at: expiresAt,
        created_by: user.id,
        status: 'pending',
      }));

    if (!rows.length) return Response.json({ error: 'No valid email addresses provided' }, { status: 400 });

    const { data, error } = await supabase.from('test_links').insert(rows).select();
    if (error) throw error;

    await auditLog({
      performedBy: user.id,
      action: 'test.links.generate',
      details: { test_id, count: rows.length },
    });

    return Response.json({ links: data || [] }, { status: 201 });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

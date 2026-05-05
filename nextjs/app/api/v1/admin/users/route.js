import { NextResponse } from 'next/server';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';
import supabase from '@/lib/supabase.js';

// GET /api/v1/admin/users?search=&role=&status=&page=1&limit=20&sort=created_at&dir=desc
export async function GET(request) {
  try {
    const { profile: adminProfile } = await requireAdmin(request);
    const { searchParams } = new URL(request.url);

    const search  = searchParams.get('search')?.trim() || '';
    const role    = searchParams.get('role')   || '';
    const status  = searchParams.get('status') || '';
    const page    = Math.max(1, parseInt(searchParams.get('page')  || '1', 10));
    const limit   = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20', 10)));
    const sort    = ['created_at', 'email', 'first_name', 'last_name', 'last_login_at'].includes(searchParams.get('sort')) ? searchParams.get('sort') : 'created_at';
    const dir     = searchParams.get('dir') === 'asc' ? true : false;

    let query = supabase
      .from('profiles')
      .select('id, email, first_name, last_name, role, status, created_at, last_login_at', { count: 'exact' });

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
    }
    if (role)   query = query.eq('role', role);
    if (status) query = query.eq('status', status);

    query = query
      .order(sort, { ascending: dir })
      .range((page - 1) * limit, page * limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ users: data || [], total: count || 0, page, limit });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error('[admin/users GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

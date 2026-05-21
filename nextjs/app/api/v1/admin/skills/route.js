import { NextResponse } from 'next/server';
import supabase from '@/lib/supabase.js';
import { requireUser } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

async function getAdminUser(request) {
  let user;
  try {
    ({ user } = await requireUser(request));
  } catch (err) {
    if (err instanceof Response) throw err;
    throw NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    throw NextResponse.json({ error: 'Forbidden — admin access required' }, { status: 403 });
  }

  return { user, profile };
}

// GET /api/v1/admin/skills?q=&category=&status=all&source=all&page=1&limit=50&sort=name&dir=asc
export async function GET(request) {
  try {
    const { user } = await getAdminUser(request);
    const { searchParams } = new URL(request.url);

    const q        = searchParams.get('q')?.trim() || '';
    const category = searchParams.get('category') || '';
    const status   = searchParams.get('status') || 'all';
    const source   = searchParams.get('source') || 'all';
    const page     = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const limit    = Math.max(1, Math.min(200, parseInt(searchParams.get('limit') || '50', 10)));
    const sort     = searchParams.get('sort') || 'name';
    const dir      = searchParams.get('dir') === 'desc' ? false : true;

    let query = supabase
      .from('skills')
      .select('*', { count: 'exact' });

    if (q)               query = query.ilike('name', `%${q}%`);
    if (category)        query = query.eq('category', category);
    if (status === 'active')   query = query.eq('is_active', true);
    if (status === 'inactive') query = query.eq('is_active', false);
    if (source !== 'all') query = query.eq('source', source);

    query = query
      .order(sort, { ascending: dir })
      .range((page - 1) * limit, page * limit - 1);

    const { data, count, error } = await query;
    if (error) throw error;

    return NextResponse.json({ skills: data || [], total: count || 0, page, limit });
  } catch (err) {
    if (err instanceof Response || err instanceof NextResponse) return err;
    console.error('[admin/skills GET]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST /api/v1/admin/skills
// Body: { name, slug, category, subcategory, aliases, description, is_active, is_trending, source, icon_url }
export async function POST(request) {
  try {
    const { user } = await getAdminUser(request);
    const body = await request.json().catch(() => ({}));

    const { name, slug, category, subcategory, aliases, description, is_active, is_trending, source, icon_url } = body;

    const { data, error } = await supabase
      .from('skills')
      .insert({
        name,
        slug,
        category,
        subcategory: subcategory ?? null,
        aliases: aliases ?? null,
        description: description ?? null,
        is_active: is_active ?? true,
        is_trending: is_trending ?? false,
        source: source ?? 'manual',
        icon_url: icon_url ?? null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ skill: data }, { status: 201 });
  } catch (err) {
    if (err instanceof Response || err instanceof NextResponse) return err;
    console.error('[admin/skills POST]', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

import supabase from '@/lib/supabase.js';
import { requireAdmin, auditLog } from '@/lib/auth-helpers.js';

export const dynamic = 'force-dynamic';

export async function GET(request, { params }) {
  try {
    const { user: admin } = await requireAdmin(request);
    const { id: userId } = await params;
    const { searchParams } = new URL(request.url);

    const from  = searchParams.get('from') || null;
    const to    = searchParams.get('to')   || null;
    const page  = Math.max(1, parseInt(searchParams.get('page'))  || 1);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit')) || 20));
    const sort  = searchParams.get('sort') || 'updated_at';
    const dir   = searchParams.get('dir')  === 'asc' ? 'asc' : 'desc';

    // Verify user exists
    const { data: targetUser } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    if (!targetUser) return Response.json({ error: 'User not found.' }, { status: 404 });

    // Fetch resumes with section ids for count
    let query = supabase
      .from('builder_resumes')
      .select('id, title, template_id, personal_info, created_at, updated_at, builder_sections(id)')
      .eq('user_id', userId);

    if (from) query = query.gte('created_at', from);
    if (to)   query = query.lte('created_at', to + 'T23:59:59.999Z');

    const { data: raw, error: rErr } = await query
      .order('updated_at', { ascending: false })
      .limit(1000);
    if (rErr) throw rErr;

    const resumes = (raw || []).map(r => ({
      id:            r.id,
      title:         r.title || 'Untitled Resume',
      template_id:   r.template_id || null,
      status:        'draft',
      created_at:    r.created_at,
      updated_at:    r.updated_at,
      section_count: Array.isArray(r.builder_sections) ? r.builder_sections.length : 0,
    }));

    // Sort
    resumes.sort((a, b) => {
      let av, bv;
      if (sort === 'title')         { av = a.title;         bv = b.title; }
      else if (sort === 'template') { av = a.template_id;   bv = b.template_id; }
      else if (sort === 'sections') { av = a.section_count; bv = b.section_count; }
      else if (sort === 'created_at') { av = a.created_at;  bv = b.created_at; }
      else                           { av = a.updated_at;   bv = b.updated_at; }
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ?  1 : -1;
      return 0;
    });

    const total     = resumes.length;
    const paginated = resumes.slice((page - 1) * limit, page * limit);

    await auditLog({
      performedBy:  admin.id,
      action:       'viewed_resume_list',
      targetUserId: userId,
      details:      { page, from, to },
    });

    return Response.json({ resumes: paginated, total, page, limit });
  } catch (err) {
    if (err instanceof Response) return err;
    return Response.json({ error: err.message }, { status: 500 });
  }
}

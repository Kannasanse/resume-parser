import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';

export const dynamic = 'force-dynamic';

async function ownerCheck(user, resumeId) {
  const { data } = await supabase
    .from('builder_resumes')
    .select('id')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single();
  return !!data;
}

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await ownerCheck(user, id)))
      return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const { data, error } = await supabase
      .from('builder_sections')
      .select('*')
      .eq('resume_id', id)
      .order('position', { ascending: true });

    if (error) throw error;
    return Response.json({ data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await ownerCheck(user, id)))
      return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const body = await req.json();
    const { type, title, content = {}, position } = body;

    // Determine position: append at end if not provided
    let pos = position;
    if (pos === undefined) {
      const { count } = await supabase
        .from('builder_sections')
        .select('id', { count: 'exact', head: true })
        .eq('resume_id', id);
      pos = count ?? 0;
    }

    const { data, error } = await supabase
      .from('builder_sections')
      .insert({ resume_id: id, type, title, content, position: pos })
      .select()
      .single();

    if (error) throw error;
    return Response.json({ data }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// PATCH /sections — bulk reorder: body = { order: [id1, id2, ...] }
export async function PATCH(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await ownerCheck(user, id)))
      return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const { order } = await req.json();
    if (!Array.isArray(order)) return Response.json({ error: 'order must be an array' }, { status: 400 });

    const updates = order.map((sectionId, idx) =>
      supabase
        .from('builder_sections')
        .update({ position: idx })
        .eq('id', sectionId)
        .eq('resume_id', id)
    );

    await Promise.all(updates);

    const { data } = await supabase
      .from('builder_sections')
      .select('*')
      .eq('resume_id', id)
      .order('position', { ascending: true });

    return Response.json({ data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

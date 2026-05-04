import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';

export const dynamic = 'force-dynamic';

async function ownerCheck(user, sectionId) {
  const { data } = await supabase
    .from('builder_sections')
    .select('id, resume_id, builder_resumes!inner(user_id)')
    .eq('id', sectionId)
    .single();
  return data?.builder_resumes?.user_id === user.id ? data : null;
}

export async function PATCH(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { sectionId } = await params;
    if (!(await ownerCheck(user, sectionId)))
      return Response.json({ error: 'Section not found.' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const allowed = ['title', 'content', 'position', 'enabled'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabase
      .from('builder_sections')
      .update(update)
      .eq('id', sectionId)
      .select()
      .single();

    if (error) throw error;
    return Response.json({ data });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { sectionId } = await params;
    if (!(await ownerCheck(user, sectionId)))
      return Response.json({ error: 'Section not found.' }, { status: 404 });

    const { error } = await supabase
      .from('builder_sections')
      .delete()
      .eq('id', sectionId);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

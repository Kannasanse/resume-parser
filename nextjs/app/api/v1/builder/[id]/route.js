import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';

export const dynamic = 'force-dynamic';

async function ownerCheck(user, id) {
  const { data } = await supabase
    .from('builder_resumes')
    .select('id')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();
  return !!data;
}

export async function GET(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    const { data: resume, error } = await supabase
      .from('builder_resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (error || !resume) return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const { data: sections } = await supabase
      .from('builder_sections')
      .select('*')
      .eq('resume_id', id)
      .order('position', { ascending: true });

    return Response.json({ data: { ...resume, sections: sections || [] } });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    if (!(await ownerCheck(user, id)))
      return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const body = await req.json().catch(() => ({}));
    const allowed = ['title', 'template_id', 'design_settings', 'personal_info'];
    const update = Object.fromEntries(Object.entries(body).filter(([k]) => allowed.includes(k)));

    const { data, error } = await supabase
      .from('builder_resumes')
      .update(update)
      .eq('id', id)
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
    const { id } = await params;
    if (!(await ownerCheck(user, id)))
      return Response.json({ error: 'Resume not found.' }, { status: 404 });

    const { error } = await supabase
      .from('builder_resumes')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

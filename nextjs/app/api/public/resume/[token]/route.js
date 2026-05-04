import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { token } = await params;

    const { data: resume, error } = await supabase
      .from('builder_resumes')
      .select('id, title, template_id, design_settings, personal_info, updated_at')
      .eq('share_token', token)
      .eq('share_enabled', true)
      .single();

    if (error || !resume) {
      return Response.json({ error: 'This resume is no longer available.' }, { status: 404 });
    }

    const { data: sections } = await supabase
      .from('builder_sections')
      .select('id, type, title, content, position, enabled')
      .eq('resume_id', resume.id)
      .order('position', { ascending: true });

    return Response.json({ data: { ...resume, sections: sections || [] } });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

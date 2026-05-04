import supabase from '@/lib/supabase.js';
import { getAuthUser } from '@/lib/authUtils.js';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const user = await getAuthUser();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    // Fetch original resume with ownership check
    const { data: original, error: fetchErr } = await supabase
      .from('builder_resumes')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single();

    if (fetchErr || !original) return Response.json({ error: 'Resume not found.' }, { status: 404 });

    // Determine a unique name: "[Title] — Copy", then "— Copy 2", etc.
    const baseTitle = `${original.title} — Copy`;
    const { data: existing } = await supabase
      .from('builder_resumes')
      .select('title')
      .eq('user_id', user.id)
      .ilike('title', `${baseTitle}%`);

    const usedTitles = new Set((existing || []).map(r => r.title));
    let copyTitle = baseTitle;
    let counter = 2;
    while (usedTitles.has(copyTitle)) {
      copyTitle = `${baseTitle} ${counter++}`;
    }

    // Create the new resume (no share link — starts disabled)
    const { data: newResume, error: createErr } = await supabase
      .from('builder_resumes')
      .insert({
        user_id: user.id,
        title: copyTitle,
        template_id: original.template_id,
        design_settings: original.design_settings,
        personal_info: original.personal_info,
        share_enabled: false,
      })
      .select()
      .single();

    if (createErr) throw createErr;

    // Fetch original sections
    const { data: originalSections } = await supabase
      .from('builder_sections')
      .select('type, title, content, position, enabled')
      .eq('resume_id', id)
      .order('position', { ascending: true });

    // Insert copies of all sections under the new resume ID
    if (originalSections?.length > 0) {
      const copies = originalSections.map(s => ({
        resume_id: newResume.id,
        type: s.type,
        title: s.title,
        content: s.content,
        position: s.position,
        enabled: s.enabled,
      }));
      const { error: sectionsErr } = await supabase
        .from('builder_sections')
        .insert(copies);
      if (sectionsErr) {
        // Roll back the resume on section failure
        await supabase.from('builder_resumes').delete().eq('id', newResume.id);
        throw sectionsErr;
      }
    }

    return Response.json({ data: { id: newResume.id, title: newResume.title } }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

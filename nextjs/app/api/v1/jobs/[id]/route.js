import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase.from('job_profiles').select('*, job_skills(*)').eq('id', id).single();
    if (error) throw error;
    if (!data) return Response.json({ error: 'Not found' }, { status: 404 });
    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      title, description, skills,
      role_type, seniority,
      required_years_experience, required_degree,
      required_field, required_certs,
      custom_weights,
      organization_id,
    } = body;

    const updates = {};
    if (title !== undefined) updates.title = title?.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (role_type !== undefined) updates.role_type = role_type;
    if (seniority !== undefined) updates.seniority = seniority;
    if (required_years_experience !== undefined) updates.required_years_experience = parseInt(required_years_experience) || 0;
    if (required_degree !== undefined) updates.required_degree = required_degree;
    if (required_field !== undefined) updates.required_field = required_field?.trim() || null;
    if (required_certs !== undefined) updates.required_certs = required_certs || [];
    if (custom_weights !== undefined) updates.custom_weights = custom_weights || null;
    if (organization_id !== undefined) updates.organization_id = organization_id || null;

    const { error: updateErr } = await supabase.from('job_profiles').update(updates).eq('id', id);
    if (updateErr) throw updateErr;

    if (skills !== undefined) {
      await supabase.from('job_skills').delete().eq('job_profile_id', id);
      if (skills.length) {
        await supabase.from('job_skills').insert(
          skills.map(s => ({
            job_profile_id: id,
            skill:        s.skill,
            proficiency:  s.proficiency,
            is_required:  s.is_required ?? true,
          }))
        );
      }
    }

    return Response.json({ message: 'Updated' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;

    // Cascade: scores + skills → job_profile
    await supabase.from('resume_scores').delete().eq('job_profile_id', id);
    await supabase.from('job_skills').delete().eq('job_profile_id', id);

    const { error } = await supabase.from('job_profiles').delete().eq('id', id);
    if (error) throw error;

    return Response.json({ message: 'Deleted' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

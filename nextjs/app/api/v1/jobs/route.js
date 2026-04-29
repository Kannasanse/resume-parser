import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('job_profiles')
      .select('id, title, role_type, seniority, created_at, job_skills(skill, proficiency, is_required)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const jobIds = (data || []).map(j => j.id);
    let countMap = {};
    if (jobIds.length > 0) {
      const { data: scoreRows } = await supabase.from('resume_scores').select('job_profile_id').in('job_profile_id', jobIds);
      for (const { job_profile_id } of scoreRows || []) {
        countMap[job_profile_id] = (countMap[job_profile_id] || 0) + 1;
      }
    }

    return Response.json((data || []).map(j => ({ ...j, candidate_count: countMap[j.id] || 0 })));
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const {
      title, description, skills = [],
      role_type = 'technical', seniority = 'mid',
      required_years_experience = 0, required_degree = 'None',
      required_field = null, required_certs = [],
      custom_weights = null,
      organization_id = null,
    } = await req.json();

    if (!title?.trim()) return Response.json({ error: 'title is required' }, { status: 400 });

    const { data: job, error: jobErr } = await supabase
      .from('job_profiles')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        role_type, seniority,
        required_years_experience: parseInt(required_years_experience) || 0,
        required_degree,
        required_field: required_field?.trim() || null,
        required_certs: required_certs || [],
        custom_weights: custom_weights || null,
        organization_id: organization_id || null,
      })
      .select()
      .single();
    if (jobErr) throw jobErr;

    if (skills.length) {
      const { error: skillErr } = await supabase.from('job_skills').insert(
        skills.map(s => ({
          job_profile_id: job.id,
          skill:        s.skill,
          proficiency:  s.proficiency,
          is_required:  s.is_required ?? true,
        }))
      );
      if (skillErr) throw skillErr;
    }

    return Response.json({ id: job.id, message: 'Job profile created' }, { status: 201 });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

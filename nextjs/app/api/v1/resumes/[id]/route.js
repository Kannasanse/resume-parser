import supabase from '@/lib/supabase.js';
import { deleteFile } from '@/lib/storage.js';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from('resumes')
      .select(`
        *,
        job_profiles(id, title),
        parsed_data (
          *,
          work_experience (*),
          education (*)
        )
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return Response.json({ error: 'Resume not found' }, { status: 404 });

    const candidateEmail = data.parsed_data?.[0]?.email;
    let siblingResumeIds = [id];

    if (candidateEmail) {
      const { data: siblings } = await supabase.from('parsed_data').select('resume_id').eq('email', candidateEmail);
      if (siblings?.length) siblingResumeIds = [...new Set(siblings.map(s => s.resume_id))];
    }

    const { data: allScores } = await supabase
      .from('resume_scores')
      .select(`
        overall_score, band, skills_score, experience_score, education_score,
        title_score, certs_score, projects_score, quality_score,
        weights_used, candidate_years, job_profile_id, resume_id, breakdown,
        job_profiles(id, title, role_type, seniority)
      `)
      .in('resume_id', siblingResumeIds)
      .order('overall_score', { ascending: false });

    const scoreMap = new Map();
    for (const s of allScores || []) {
      const existing = scoreMap.get(s.job_profile_id);
      if (!existing || s.overall_score > existing.overall_score) scoreMap.set(s.job_profile_id, s);
    }

    data.scores = [...scoreMap.values()].sort((a, b) => b.overall_score - a.overall_score);
    data.score  = data.scores.find(s => s.job_profile_id === data.job_id) || data.scores[0] || null;

    return Response.json(data);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    const { data: resume } = await supabase.from('resumes').select('file_url').eq('id', id).single();
    if (resume?.file_url) {
      const path = resume.file_url.split('/').pop();
      await deleteFile(path).catch(() => {});
    }
    const { error } = await supabase.from('resumes').delete().eq('id', id);
    if (error) throw error;
    return Response.json({ message: 'Deleted successfully' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

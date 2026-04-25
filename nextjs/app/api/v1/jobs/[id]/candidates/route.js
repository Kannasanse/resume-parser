import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id: jobId } = await params;

    const { data: scoreRows, error: scoreErr } = await supabase
      .from('resume_scores')
      .select('resume_id, overall_score, band, skills_score, experience_score, education_score, title_score, certs_score, projects_score, quality_score, weights_used, candidate_years')
      .eq('job_profile_id', jobId);
    if (scoreErr) throw scoreErr;

    const scoredIds = new Set((scoreRows || []).map(s => s.resume_id));

    let unscoredIds = [];
    if (scoredIds.size > 0) {
      const { data, error } = await supabase.from('resumes').select('id').eq('job_id', jobId).not('id', 'in', `(${[...scoredIds].join(',')})`);
      if (error) throw error;
      unscoredIds = (data || []).map(r => r.id);
    } else {
      const { data, error } = await supabase.from('resumes').select('id').eq('job_id', jobId);
      if (error) throw error;
      unscoredIds = (data || []).map(r => r.id);
    }

    const allIds = [...scoredIds, ...unscoredIds];
    if (allIds.length === 0) return Response.json([]);

    const { data: resumes, error: resumeErr } = await supabase
      .from('resumes')
      .select('id, file_name, status, created_at, parsed_data(candidate_name, email, phone, skills)')
      .in('id', allIds);
    if (resumeErr) throw resumeErr;

    const scoreMap = Object.fromEntries((scoreRows || []).map(s => [s.resume_id, s]));

    const candidates = (resumes || []).map(r => ({
      resume_id:      r.id,
      file_name:      r.file_name,
      status:         r.status,
      created_at:     r.created_at,
      candidate_name: r.parsed_data?.[0]?.candidate_name || null,
      email:          r.parsed_data?.[0]?.email || null,
      phone:          r.parsed_data?.[0]?.phone || null,
      skills:         r.parsed_data?.[0]?.skills || [],
      score:          scoreMap[r.id] ? {
        overall_score:    scoreMap[r.id].overall_score,
        band:             scoreMap[r.id].band,
        skills_score:     scoreMap[r.id].skills_score,
        experience_score: scoreMap[r.id].experience_score,
        education_score:  scoreMap[r.id].education_score,
        title_score:      scoreMap[r.id].title_score,
        certs_score:      scoreMap[r.id].certs_score,
        projects_score:   scoreMap[r.id].projects_score,
        quality_score:    scoreMap[r.id].quality_score,
        weights_used:     scoreMap[r.id].weights_used,
        candidate_years:  scoreMap[r.id].candidate_years,
      } : null,
    }));

    candidates.sort((a, b) => (b.score?.overall_score ?? -1) - (a.score?.overall_score ?? -1));
    return Response.json(candidates);
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

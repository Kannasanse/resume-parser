import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page  = parseInt(searchParams.get('page'))  || 1;
    const limit = parseInt(searchParams.get('limit')) || 10;
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('resumes')
      .select(`
        *,
        parsed_data(candidate_name, email, skills),
        job_profiles(id, title),
        resume_scores(overall_score, band, job_profile_id, job_profiles(id, title))
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    return Response.json({ data, total: count, page, limit });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

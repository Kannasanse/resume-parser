import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const page   = parseInt(searchParams.get('page'))  || 1;
    const limit  = parseInt(searchParams.get('limit')) || 50;
    const search = searchParams.get('search')?.trim()  || '';
    const sort   = searchParams.get('sort') || '';
    const from   = (page - 1) * limit;

    let ids = null;

    if (search) {
      const [{ data: byName }, { data: byEmail }] = await Promise.all([
        supabase.from('parsed_data').select('resume_id').ilike('candidate_name', `%${search}%`),
        supabase.from('parsed_data').select('resume_id').ilike('email', `%${search}%`),
      ]);
      ids = [...new Set([
        ...(byName  || []).map(r => r.resume_id),
        ...(byEmail || []).map(r => r.resume_id),
      ])];
      if (ids.length === 0) {
        return Response.json({ data: [], total: 0, page, limit });
      }
    }

    const RESUME_SELECT = `
      *,
      parsed_data(candidate_name, email, skills),
      job_profiles(id, title),
      resume_scores(overall_score, band, job_profile_id, job_profiles(id, title))
    `;

    if (sort === 'name_asc') {
      let pdQuery = supabase
        .from('parsed_data')
        .select('resume_id')
        .order('candidate_name', { ascending: true })
        .not('resume_id', 'is', null);
      if (ids !== null) pdQuery = pdQuery.in('resume_id', ids);
      const { data: sortedPd } = await pdQuery;
      const allSortedIds = (sortedPd || []).map(r => r.resume_id);
      const total = allSortedIds.length;
      const pageIds = allSortedIds.slice(from, from + limit);
      if (pageIds.length === 0) return Response.json({ data: [], total, page, limit });
      const { data, error } = await supabase.from('resumes').select(RESUME_SELECT).in('id', pageIds);
      if (error) throw error;
      const idIndex = Object.fromEntries(pageIds.map((id, i) => [id, i]));
      const sorted = [...(data || [])].sort((a, b) => idIndex[a.id] - idIndex[b.id]);
      return Response.json({ data: sorted, total, page, limit });
    }

    let query = supabase
      .from('resumes')
      .select(RESUME_SELECT, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (ids !== null) query = query.in('id', ids);

    const { data, error, count } = await query.range(from, from + limit - 1);
    if (error) throw error;
    return Response.json({ data, total: count, page, limit });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

import supabase from '@/lib/supabase.js';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    const { data, error } = await supabase
      .from('resumes')
      .select('*, parsed_data(*, work_experience(*), education(*))')
      .eq('id', id)
      .single();

    if (error || !data) return Response.json({ error: 'Resume not found' }, { status: 404 });

    if (format === 'csv') {
      const pd = data.parsed_data?.[0] || {};
      const csv = [
        'Name,Email,Phone,Skills',
        `"${pd.candidate_name || ''}","${pd.email || ''}","${pd.phone || ''}","${(pd.skills || []).join('; ')}"`,
      ].join('\n');
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="resume_${id}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="resume_${id}.json"`,
      },
    });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

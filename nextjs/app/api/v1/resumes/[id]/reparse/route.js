import supabase from '@/lib/supabase.js';
import { parseResume } from '@/lib/parser.js';
import { upsertScore } from '@/lib/scorer.js';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  try {
    const { id } = await params;
    const { data: resume, error } = await supabase.from('resumes').select('raw_text, job_id').eq('id', id).single();

    if (error || !resume) return Response.json({ error: 'Resume not found' }, { status: 404 });
    if (!resume.raw_text) return Response.json({ error: 'No raw text available for reparsing' }, { status: 400 });

    await supabase.from('parsed_data').delete().eq('resume_id', id);
    await supabase.from('resumes').update({ status: 'processing' }).eq('id', id);

    const { structured } = await parseResume(Buffer.from(resume.raw_text), 'text/plain');

    const { data: parsed } = await supabase
      .from('parsed_data')
      .insert({
        resume_id:      id,
        candidate_name: structured.candidate_name,
        email:          structured.email,
        phone:          structured.phone,
        summary:        structured.summary,
        skills:         structured.skills,
        raw_json:       structured.raw_json || structured,
      })
      .select()
      .single();

    if (structured.work_experience?.length) {
      await supabase.from('work_experience').insert(
        structured.work_experience.map(w => ({
          parsed_data_id: parsed.id,
          title:       w.title,
          company:     w.company,
          start_date:  w.start_date,
          end_date:    w.end_date,
          description: w.description,
        }))
      );
    }

    if (structured.education?.length) {
      await supabase.from('education').insert(
        structured.education.map(e => ({
          parsed_data_id:  parsed.id,
          institution:     e.institution,
          degree:          e.degree,
          field:           e.field,
          graduation_year: e.graduation_year,
        }))
      );
    }

    await supabase.from('resumes').update({ status: 'completed' }).eq('id', id);

    if (resume.job_id) {
      await upsertScore(id, resume.job_id).catch(e => console.error('Rescore error:', e.message));
    }

    return Response.json({ message: 'Reparsed successfully' });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

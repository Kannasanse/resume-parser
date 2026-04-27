import supabase from '@/lib/supabase.js';
import { parseResume } from '@/lib/parser.js';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const { id } = await params; // hoisted — accessible in catch

  try {
    const { data: resume, error } = await supabase.from('resumes').select('raw_text, job_id').eq('id', id).single();

    if (error || !resume) return Response.json({ error: 'Resume not found' }, { status: 404 });
    if (!resume.raw_text) return Response.json({ error: 'No raw text available for reparsing' }, { status: 400 });

    // Clear old parsed data before re-inserting
    const { data: oldParsed } = await supabase.from('parsed_data').select('id').eq('resume_id', id);
    const oldIds = (oldParsed || []).map(p => p.id);
    if (oldIds.length) {
      await supabase.from('work_experience').delete().in('parsed_data_id', oldIds);
      await supabase.from('education').delete().in('parsed_data_id', oldIds);
    }
    await supabase.from('parsed_data').delete().eq('resume_id', id);
    await supabase.from('resumes').update({ status: 'processing' }).eq('id', id);

    const { structured } = await parseResume(Buffer.from(resume.raw_text), 'text/plain');

    const { data: parsed, error: parsedErr } = await supabase
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
    if (parsedErr) throw parsedErr;

    if (structured.work_experience?.length) {
      await supabase.from('work_experience').insert(
        structured.work_experience.map(w => ({
          parsed_data_id: parsed.id,
          title:       w.title,
          company:     w.company,
          location:    w.location || null,
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
          grade:           e.grade || null,
          start_date:      e.start_date || null,
          end_date:        e.end_date || null,
          graduation_year: e.graduation_year,
        }))
      );
    }

    const parseStatus = structured._fallback ? 'partial' : 'completed';
    await supabase.from('resumes').update({ status: parseStatus }).eq('id', id);

    return Response.json({
      message: structured._fallback
        ? 'Reparsed with basic extraction — AI parsing failed again'
        : 'Reparsed successfully',
      status: parseStatus,
      job_id: resume.job_id || null,
    });
  } catch (err) {
    console.error('[reparse]', err.message);
    await supabase.from('resumes').update({ status: 'failed' }).eq('id', id).catch(() => {});
    return Response.json({ error: err.message }, { status: 500 });
  }
}

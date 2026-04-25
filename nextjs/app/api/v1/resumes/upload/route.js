import supabase from '@/lib/supabase.js';
import { uploadFile } from '@/lib/storage.js';
import { parseResume } from '@/lib/parser.js';
import { upsertScore } from '@/lib/scorer.js';

export const dynamic = 'force-dynamic';

const ALLOWED = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file  = formData.get('resume');
    const jobId = formData.get('job_id') || null;

    if (!file) return Response.json({ error: 'No file uploaded' }, { status: 400 });
    if (!ALLOWED.includes(file.type))
      return Response.json({ error: 'Only PDF and DOCX files are supported' }, { status: 400 });

    if (jobId) {
      const { data: job } = await supabase.from('job_profiles').select('id').eq('id', jobId).single();
      if (!job) return Response.json({ error: 'Invalid job_id — job profile not found' }, { status: 400 });
    }

    const { data: resume, error: insertErr } = await supabase
      .from('resumes')
      .insert({ file_name: file.name, status: 'processing', job_id: jobId })
      .select()
      .single();
    if (insertErr) throw insertErr;

    const buffer = Buffer.from(await file.arrayBuffer());
    const { url } = await uploadFile(buffer, file.name, file.type);
    const { rawText, structured } = await parseResume(buffer, file.type);

    await supabase.from('resumes').update({ file_url: url, raw_text: rawText, status: 'completed' }).eq('id', resume.id);

    const { data: parsed, error: parsedErr } = await supabase
      .from('parsed_data')
      .insert({
        resume_id:      resume.id,
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

    let scoreResult = null;
    if (jobId) {
      try { scoreResult = await upsertScore(resume.id, jobId); } catch (e) { console.error('Scoring error:', e.message); }
    }

    return Response.json({
      id: resume.id,
      message: 'Resume parsed successfully',
      score: scoreResult ? { overall: scoreResult.overall, band: scoreResult.band } : null,
    }, { status: 201 });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

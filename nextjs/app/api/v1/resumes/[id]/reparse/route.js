import supabase from '@/lib/supabase.js';
import { parseResume } from '@/lib/parser.js';
import { mimeFromFilename } from '@/lib/mimeTypes.js';

export const dynamic = 'force-dynamic';

export async function POST(req, { params }) {
  const { id } = await params; // hoisted — accessible in catch

  try {
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('raw_text, file_url, file_name, job_id')
      .eq('id', id)
      .single();

    if (error || !resume) return Response.json({ error: 'Resume not found' }, { status: 404 });

    // Determine buffer + mimeType — prefer stored raw_text, fall back to re-downloading the file
    let buffer, mimeType;
    if (resume.raw_text) {
      buffer   = Buffer.from(resume.raw_text);
      mimeType = 'text/plain';
    } else if (resume.file_url) {
      const fileRes = await fetch(resume.file_url);
      if (!fileRes.ok) return Response.json({ error: 'Could not download original file from storage' }, { status: 502 });
      buffer   = Buffer.from(await fileRes.arrayBuffer());
      mimeType = mimeFromFilename(resume.file_name);
    } else {
      // No file available — but if raw_json already exists, just re-sync the
      // relational tables (work_experience / education) from it without reparsing
      const { data: existingPd } = await supabase
        .from('parsed_data')
        .select('id, raw_json')
        .eq('resume_id', id)
        .single();

      if (!existingPd?.raw_json) {
        return Response.json({ error: 'No source available for reparsing — please re-upload the original file' }, { status: 400 });
      }

      const rj = existingPd.raw_json;
      const exp  = rj.experience || [];
      const edu  = rj.education  || [];

      // Clear stale rows and re-insert from raw_json
      await supabase.from('work_experience').delete().eq('parsed_data_id', existingPd.id);
      await supabase.from('education').delete().eq('parsed_data_id', existingPd.id);

      if (exp.length) {
        const { error: weErr } = await supabase.from('work_experience').insert(
          exp.map(w => ({
            parsed_data_id: existingPd.id,
            title:       w.title,
            company:     w.company,
            start_date:  w.start_date,
            end_date:    w.end_date,
            description: w.description,
          }))
        );
        if (weErr) console.error('[reparse] work_experience insert:', weErr.message);
      }

      if (edu.length) {
        const { error: eduErr } = await supabase.from('education').insert(
          edu.map(e => ({
            parsed_data_id:  existingPd.id,
            institution:     e.institution,
            degree:          e.degree,
            field:           e.field,
            graduation_year: e.end_date || e.graduation_year,
          }))
        );
        if (eduErr) console.error('[reparse] education insert:', eduErr.message);
      }

      await supabase.from('resumes').update({ status: 'completed' }).eq('id', id);
      return Response.json({ message: 'Sections restored from existing parsed data', status: 'completed' });
    }

    // Clear old parsed data before re-inserting
    const { data: oldParsed } = await supabase.from('parsed_data').select('id').eq('resume_id', id);
    const oldIds = (oldParsed || []).map(p => p.id);
    if (oldIds.length) {
      await supabase.from('work_experience').delete().in('parsed_data_id', oldIds);
      await supabase.from('education').delete().in('parsed_data_id', oldIds);
    }
    await supabase.from('parsed_data').delete().eq('resume_id', id);
    await supabase.from('resumes').update({ status: 'processing' }).eq('id', id);

    const { rawText, structured } = await parseResume(buffer, mimeType);

    // Save extracted text for future reparses if it wasn't stored before
    if (!resume.raw_text && rawText) {
      await supabase.from('resumes').update({ raw_text: rawText }).eq('id', id).catch(() => {});
    }

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
      const { error: weErr } = await supabase.from('work_experience').insert(
        structured.work_experience.map(w => ({
          parsed_data_id: parsed.id,
          title:       w.title,
          company:     w.company,
          start_date:  w.start_date,
          end_date:    w.end_date,
          description: w.description,
        }))
      );
      if (weErr) console.error('[reparse] work_experience insert failed:', weErr.message);
    }

    if (structured.education?.length) {
      const { error: eduErr } = await supabase.from('education').insert(
        structured.education.map(e => ({
          parsed_data_id:  parsed.id,
          institution:     e.institution,
          degree:          e.degree,
          field:           e.field,
          graduation_year: e.graduation_year,
        }))
      );
      if (eduErr) console.error('[reparse] education insert failed:', eduErr.message);
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

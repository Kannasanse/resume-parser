const express = require('express');
const multer = require('multer');
const supabase = require('../services/supabase');
const { uploadFile, deleteFile } = require('../services/storage');
const { parseResume } = require('../services/parser');
const { upsertScore } = require('../services/scorer');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/v1/resumes/upload
router.post('/upload', upload.single('resume'), async (req, res) => {
  try {
    const file = req.file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(file.mimetype))
      return res.status(400).json({ error: 'Only PDF and DOCX files are supported' });

    const jobId = req.body.job_id || null;

    // Validate job_id if provided
    if (jobId) {
      const { data: job } = await supabase.from('job_profiles').select('id').eq('id', jobId).single();
      if (!job) return res.status(400).json({ error: 'Invalid job_id — job profile not found' });
    }

    // Save initial record
    const { data: resume, error: insertErr } = await supabase
      .from('resumes')
      .insert({ file_name: file.originalname, status: 'processing', job_id: jobId })
      .select()
      .single();
    if (insertErr) throw insertErr;

    // Upload to storage
    const { url } = await uploadFile(file.buffer, file.originalname, file.mimetype);

    // Parse resume
    const { rawText, structured } = await parseResume(file.buffer, file.mimetype);

    // Update resume record
    await supabase
      .from('resumes')
      .update({ file_url: url, raw_text: rawText, status: 'completed' })
      .eq('id', resume.id);

    // Insert parsed_data
    const { data: parsed, error: parsedErr } = await supabase
      .from('parsed_data')
      .insert({
        resume_id: resume.id,
        candidate_name: structured.candidate_name,
        email: structured.email,
        phone: structured.phone,
        summary: structured.summary,
        skills: structured.skills,
        raw_json: structured,
      })
      .select()
      .single();
    if (parsedErr) throw parsedErr;

    // Insert work experience
    if (structured.work_experience?.length) {
      await supabase.from('work_experience').insert(
        structured.work_experience.map(w => ({ ...w, parsed_data_id: parsed.id }))
      );
    }

    // Insert education
    if (structured.education?.length) {
      await supabase.from('education').insert(
        structured.education.map(e => ({ ...e, parsed_data_id: parsed.id }))
      );
    }

    // Auto-score if linked to a job profile
    let scoreResult = null;
    if (jobId) {
      try {
        scoreResult = await upsertScore(resume.id, jobId, supabase);
      } catch (scoreErr) {
        console.error('Scoring error (non-fatal):', scoreErr.message);
      }
    }

    res.status(201).json({
      id: resume.id,
      message: 'Resume parsed successfully',
      score: scoreResult ? { overall: scoreResult.overall, band: scoreResult.band } : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/resumes
router.get('/', async (req, res) => {
  try {
    const page  = parseInt(req.query.page)  || 1;
    const limit = parseInt(req.query.limit) || 10;
    const from  = (page - 1) * limit;

    const { data, error, count } = await supabase
      .from('resumes')
      .select('*, parsed_data(candidate_name, email, skills), job_profiles(id, title)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, from + limit - 1);

    if (error) throw error;
    res.json({ data, total: count, page, limit });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/resumes/:id
router.get('/:id', async (req, res) => {
  try {
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
      .eq('id', req.params.id)
      .single();

    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Resume not found' });

    // Attach score if linked to a job
    if (data.job_id) {
      const { data: score } = await supabase
        .from('resume_scores')
        .select('overall_score, band, skills_score, experience_score, education_score, title_score, certs_score, projects_score, quality_score, weights_used, candidate_years')
        .eq('resume_id', req.params.id)
        .eq('job_profile_id', data.job_id)
        .single();
      data.score = score || null;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/resumes/:id
router.delete('/:id', async (req, res) => {
  try {
    const { data: resume } = await supabase
      .from('resumes')
      .select('file_url')
      .eq('id', req.params.id)
      .single();

    if (resume?.file_url) {
      const path = resume.file_url.split('/').pop();
      await deleteFile(path).catch(() => {});
    }

    const { error } = await supabase.from('resumes').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/resumes/:id/export
router.get('/:id/export', async (req, res) => {
  try {
    const format = req.query.format || 'json';
    const { data, error } = await supabase
      .from('resumes')
      .select('*, parsed_data(*, work_experience(*), education(*))')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Resume not found' });

    if (format === 'csv') {
      const pd = data.parsed_data?.[0] || {};
      const csv = [
        'Name,Email,Phone,Skills',
        `"${pd.candidate_name || ''}","${pd.email || ''}","${pd.phone || ''}","${(pd.skills || []).join('; ')}"`,
      ].join('\n');
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="resume_${req.params.id}.csv"`);
      return res.send(csv);
    }

    res.setHeader('Content-Disposition', `attachment; filename="resume_${req.params.id}.json"`);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/resumes/:id/reparse
router.post('/:id/reparse', async (req, res) => {
  try {
    const { data: resume, error } = await supabase
      .from('resumes')
      .select('raw_text, job_id')
      .eq('id', req.params.id)
      .single();

    if (error || !resume) return res.status(404).json({ error: 'Resume not found' });
    if (!resume.raw_text) return res.status(400).json({ error: 'No raw text available for reparsing' });

    const { parseResume: pr } = require('../services/parser');

    await supabase.from('parsed_data').delete().eq('resume_id', req.params.id);
    await supabase.from('resumes').update({ status: 'processing' }).eq('id', req.params.id);

    const { structured } = await pr(Buffer.from(resume.raw_text), 'text/plain');

    const { data: parsed } = await supabase
      .from('parsed_data')
      .insert({
        resume_id: req.params.id,
        candidate_name: structured.candidate_name,
        email: structured.email,
        phone: structured.phone,
        summary: structured.summary,
        skills: structured.skills,
        raw_json: structured,
      })
      .select()
      .single();

    if (structured.work_experience?.length)
      await supabase.from('work_experience').insert(
        structured.work_experience.map(w => ({ ...w, parsed_data_id: parsed.id }))
      );

    if (structured.education?.length)
      await supabase.from('education').insert(
        structured.education.map(e => ({ ...e, parsed_data_id: parsed.id }))
      );

    await supabase.from('resumes').update({ status: 'completed' }).eq('id', req.params.id);

    // Re-score if linked to a job
    if (resume.job_id) {
      await upsertScore(req.params.id, resume.job_id, supabase).catch(e => console.error('Rescore error:', e.message));
    }

    res.json({ message: 'Reparsed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/resumes/:id/score  — manually trigger scoring against a job
router.post('/:id/score', async (req, res) => {
  try {
    const { job_id } = req.body;
    if (!job_id) return res.status(400).json({ error: 'job_id is required' });

    const result = await upsertScore(req.params.id, job_id, supabase);
    if (!result) return res.status(404).json({ error: 'Resume or job profile not found' });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

const express = require('express');
const supabase = require('../services/supabase');
const { parseJobSkills } = require('../services/jobParser');
const { upsertScore } = require('../services/scorer');

const router = express.Router();

// POST /api/v1/jobs/parse-skills  — parse description, return skills (no DB write)
router.post('/parse-skills', async (req, res) => {
  const { description } = req.body;
  if (!description?.trim()) return res.status(400).json({ error: 'description is required' });
  try {
    const skills = await parseJobSkills(description);
    res.json({ skills });
  } catch (err) {
    console.error('Skill parsing error:', err.message);
    res.status(500).json({ error: 'Failed to parse skills. Please try again.' });
  }
});

// POST /api/v1/jobs  — create job profile with skills
router.post('/', async (req, res) => {
  try {
    const {
      title, description, skills = [],
      role_type = 'technical', seniority = 'mid',
      required_years_experience = 0, required_degree = 'None',
      required_field = null, required_certs = [],
      custom_weights = null,
    } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });

    const { data: job, error: jobErr } = await supabase
      .from('job_profiles')
      .insert({
        title: title.trim(),
        description: description?.trim() || null,
        role_type, seniority,
        required_years_experience: parseInt(required_years_experience) || 0,
        required_degree,
        required_field: required_field?.trim() || null,
        required_certs: required_certs || [],
        custom_weights: custom_weights || null,
      })
      .select()
      .single();
    if (jobErr) throw jobErr;

    if (skills.length) {
      const { error: skillErr } = await supabase.from('job_skills').insert(
        skills.map(s => ({
          job_profile_id: job.id,
          skill: s.skill,
          proficiency: s.proficiency,
          is_required: s.is_required ?? true,
        }))
      );
      if (skillErr) throw skillErr;
    }

    res.status(201).json({ id: job.id, message: 'Job profile created' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/jobs  — list all job profiles
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_profiles')
      .select('id, title, description, role_type, seniority, required_years_experience, required_degree, created_at, job_skills(count)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/jobs/:id  — get job profile with skills
router.get('/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_profiles')
      .select('*, job_skills(*)')
      .eq('id', req.params.id)
      .single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/v1/jobs/:id/candidates  — list all resumes scored against this job + unscored resumes uploaded to it
router.get('/:id/candidates', async (req, res) => {
  try {
    const jobId = req.params.id;

    // 1. All resumes that have been scored against this job (regardless of their primary job_id)
    const { data: scoredRows, error: scoreErr } = await supabase
      .from('resume_scores')
      .select(`
        overall_score, band, skills_score, experience_score, education_score,
        title_score, certs_score, projects_score, quality_score, weights_used, candidate_years,
        resume_id,
        resumes!inner(id, file_name, status, created_at,
          parsed_data(candidate_name, email, phone, skills)
        )
      `)
      .eq('job_profile_id', jobId);
    if (scoreErr) throw scoreErr;

    const scoredIds = new Set((scoredRows || []).map(s => s.resume_id));

    // 2. Unscored resumes that were originally uploaded to this job
    let unscoredRows = [];
    const unscoredQuery = supabase
      .from('resumes')
      .select('id, file_name, status, created_at, parsed_data(candidate_name, email, phone, skills)')
      .eq('job_id', jobId);
    const { data: rawUnscored, error: unscoredErr } = scoredIds.size > 0
      ? await unscoredQuery.not('id', 'in', `(${[...scoredIds].join(',')})`)
      : await unscoredQuery;
    if (unscoredErr) throw unscoredErr;
    unscoredRows = rawUnscored || [];

    const candidates = [
      ...(scoredRows || []).map(s => ({
        resume_id: s.resume_id,
        file_name: s.resumes.file_name,
        status: s.resumes.status,
        created_at: s.resumes.created_at,
        candidate_name: s.resumes.parsed_data?.[0]?.candidate_name || null,
        email: s.resumes.parsed_data?.[0]?.email || null,
        phone: s.resumes.parsed_data?.[0]?.phone || null,
        skills: s.resumes.parsed_data?.[0]?.skills || [],
        score: {
          overall_score: s.overall_score, band: s.band,
          skills_score: s.skills_score, experience_score: s.experience_score,
          education_score: s.education_score, title_score: s.title_score,
          certs_score: s.certs_score, projects_score: s.projects_score,
          quality_score: s.quality_score, weights_used: s.weights_used,
          candidate_years: s.candidate_years,
        },
      })),
      ...unscoredRows.map(r => ({
        resume_id: r.id,
        file_name: r.file_name,
        status: r.status,
        created_at: r.created_at,
        candidate_name: r.parsed_data?.[0]?.candidate_name || null,
        email: r.parsed_data?.[0]?.email || null,
        phone: r.parsed_data?.[0]?.phone || null,
        skills: r.parsed_data?.[0]?.skills || [],
        score: null,
      })),
    ];

    candidates.sort((a, b) => (b.score?.overall_score ?? -1) - (a.score?.overall_score ?? -1));
    res.json(candidates);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/jobs/:id/score/:resumeId  — trigger/refresh scoring for a resume
router.post('/:id/score/:resumeId', async (req, res) => {
  try {
    const result = await upsertScore(req.params.resumeId, req.params.id, supabase);
    if (!result) return res.status(404).json({ error: 'Resume or job profile not found' });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/v1/jobs/:id  — update title/description, scoring params, and replace skills
router.put('/:id', async (req, res) => {
  try {
    const {
      title, description, skills,
      role_type, seniority,
      required_years_experience, required_degree,
      required_field, required_certs,
      custom_weights,
    } = req.body;

    const updates = {};
    if (title !== undefined) updates.title = title?.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (role_type !== undefined) updates.role_type = role_type;
    if (seniority !== undefined) updates.seniority = seniority;
    if (required_years_experience !== undefined) updates.required_years_experience = parseInt(required_years_experience) || 0;
    if (required_degree !== undefined) updates.required_degree = required_degree;
    if (required_field !== undefined) updates.required_field = required_field?.trim() || null;
    if (required_certs !== undefined) updates.required_certs = required_certs || [];
    if (custom_weights !== undefined) updates.custom_weights = custom_weights || null;

    const { error: updateErr } = await supabase
      .from('job_profiles')
      .update(updates)
      .eq('id', req.params.id);
    if (updateErr) throw updateErr;

    if (skills !== undefined) {
      await supabase.from('job_skills').delete().eq('job_profile_id', req.params.id);
      if (skills.length) {
        await supabase.from('job_skills').insert(
          skills.map(s => ({
            job_profile_id: req.params.id,
            skill: s.skill,
            proficiency: s.proficiency,
            is_required: s.is_required ?? true,
          }))
        );
      }
    }

    res.json({ message: 'Updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/v1/jobs/:id
router.delete('/:id', async (req, res) => {
  try {
    const { error } = await supabase.from('job_profiles').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

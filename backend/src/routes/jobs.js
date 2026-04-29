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
      organization_id = null,
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
        organization_id: organization_id || null,
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
      .select('id, title, role_type, seniority, created_at, job_skills(skill, proficiency, is_required)')
      .order('created_at', { ascending: false });
    if (error) throw error;

    // Count candidates per job from resume_scores in one query
    const jobIds = (data || []).map(j => j.id);
    let countMap = {};
    if (jobIds.length > 0) {
      const { data: scoreRows } = await supabase
        .from('resume_scores')
        .select('job_profile_id')
        .in('job_profile_id', jobIds);
      for (const { job_profile_id } of scoreRows || []) {
        countMap[job_profile_id] = (countMap[job_profile_id] || 0) + 1;
      }
    }

    const result = (data || []).map(j => ({ ...j, candidate_count: countMap[j.id] || 0 }));
    res.json(result);
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

    // 1. All scores for this job
    const { data: scoreRows, error: scoreErr } = await supabase
      .from('resume_scores')
      .select('resume_id, overall_score, band, skills_score, experience_score, education_score, title_score, certs_score, projects_score, quality_score, weights_used, candidate_years, scored_at')
      .eq('job_profile_id', jobId);
    if (scoreErr) throw scoreErr;

    const scoredIds = new Set((scoreRows || []).map(s => s.resume_id));

    // 2. Unscored resumes uploaded directly to this job
    let unscoredIds = [];
    if (scoredIds.size > 0) {
      const { data, error } = await supabase
        .from('resumes').select('id').eq('job_id', jobId)
        .not('id', 'in', `(${[...scoredIds].join(',')})`);
      if (error) throw error;
      unscoredIds = (data || []).map(r => r.id);
    } else {
      const { data, error } = await supabase
        .from('resumes').select('id').eq('job_id', jobId);
      if (error) throw error;
      unscoredIds = (data || []).map(r => r.id);
    }

    // 3. Fetch full resume data for all candidate IDs in one query
    const allIds = [...scoredIds, ...unscoredIds];
    if (allIds.length === 0) return res.json([]);

    const { data: resumes, error: resumeErr } = await supabase
      .from('resumes')
      .select('id, file_name, status, created_at, parsed_data(candidate_name, email, phone, skills)')
      .in('id', allIds);
    if (resumeErr) throw resumeErr;

    const scoreMap = Object.fromEntries((scoreRows || []).map(s => [s.resume_id, s]));

    const candidates = (resumes || []).map(r => ({
      resume_id: r.id,
      file_name: r.file_name,
      status: r.status,
      created_at: r.created_at,
      candidate_name: r.parsed_data?.[0]?.candidate_name || null,
      email: r.parsed_data?.[0]?.email || null,
      phone: r.parsed_data?.[0]?.phone || null,
      skills: r.parsed_data?.[0]?.skills || [],
      score: scoreMap[r.id] ? {
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
        scored_at:        scoreMap[r.id].scored_at,
      } : null,
    }));

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
      organization_id,
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
    if (organization_id !== undefined) updates.organization_id = organization_id || null;

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

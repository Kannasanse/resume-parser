const express = require('express');
const supabase = require('../services/supabase');
const { parseJobSkills } = require('../services/jobParser');

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
    const { title, description, skills = [] } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'title is required' });

    const { data: job, error: jobErr } = await supabase
      .from('job_profiles')
      .insert({ title: title.trim(), description: description?.trim() || null })
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
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('job_profiles')
      .select('id, title, description, created_at, job_skills(count)')
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

// PUT /api/v1/jobs/:id  — update title/description and replace skills
router.put('/:id', async (req, res) => {
  try {
    const { title, description, skills } = req.body;

    const { error: updateErr } = await supabase
      .from('job_profiles')
      .update({ title: title?.trim(), description: description?.trim() })
      .eq('id', req.params.id);
    if (updateErr) throw updateErr;

    if (skills) {
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

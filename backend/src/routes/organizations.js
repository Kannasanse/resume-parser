const express = require('express');
const supabase = require('../services/supabase');

const router = express.Router();

// GET /api/v1/organizations
router.get('/', async (_req, res) => {
  try {
    const { data, error } = await supabase
      .from('organizations')
      .select('id, name')
      .order('name');
    if (error) throw error;
    res.json(data || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/v1/organizations
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'name is required' });

    const { data, error } = await supabase
      .from('organizations')
      .insert({ name: name.trim() })
      .select('id, name')
      .single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

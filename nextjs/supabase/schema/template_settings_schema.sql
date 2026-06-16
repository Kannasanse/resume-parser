-- Template settings: admin-controlled metadata for resume builder templates.
-- Run this migration once against the Supabase project.

CREATE TABLE IF NOT EXISTS template_settings (
  template_id  TEXT        PRIMARY KEY,
  featured     BOOLEAN     NOT NULL DEFAULT false,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed all known templates with featured = false.
-- Re-running is idempotent (ON CONFLICT DO NOTHING).
INSERT INTO template_settings (template_id) VALUES
  ('modern'),
  ('atlantic-blue'),
  ('corporate'),
  ('atlantic-crest'),
  ('mercury-flow'),
  ('steady-form'),
  ('executive')
ON CONFLICT (template_id) DO NOTHING;

-- Allow the service-role key (used by API routes) full access.
ALTER TABLE template_settings ENABLE ROW LEVEL SECURITY;

-- Admins and the service role can read and write.
-- Authenticated users can read (to display featured badges).
CREATE POLICY "Anyone authenticated can read template_settings"
  ON template_settings FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Service role can write template_settings"
  ON template_settings FOR ALL
  USING (auth.role() = 'service_role');

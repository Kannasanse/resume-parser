-- Run this in Supabase SQL Editor after schema.sql

-- Resume builder documents (one per user-created resume)
CREATE TABLE IF NOT EXISTS builder_resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled Resume',
  template_id TEXT NOT NULL DEFAULT 'classic-professional',
  design_settings JSONB DEFAULT '{"font":"source-sans","colorTheme":"slate-blue","spacing":"normal","margins":"normal","pageSize":"a4"}',
  personal_info JSONB DEFAULT '{"name":"","email":"","phone":"","location":"","linkedin":"","github":"","website":"","summary":""}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ordered sections within a builder resume
CREATE TABLE IF NOT EXISTS builder_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES builder_resumes(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'summary','work_experience','education','skills',
    'certifications','projects','languages','hobbies',
    'references','custom'
  )),
  title TEXT NOT NULL,
  content JSONB DEFAULT '{}',
  position INTEGER NOT NULL DEFAULT 0,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE builder_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE builder_sections ENABLE ROW LEVEL SECURITY;

-- RLS: users only see and modify their own data
CREATE POLICY "builder_resumes_owner" ON builder_resumes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "builder_sections_owner" ON builder_sections
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM builder_resumes
      WHERE id = builder_sections.resume_id AND user_id = auth.uid()
    )
  );

-- Auto-update updated_at triggers (reuses function from schema.sql)
DROP TRIGGER IF EXISTS builder_resumes_updated_at ON builder_resumes;
CREATE TRIGGER builder_resumes_updated_at
  BEFORE UPDATE ON builder_resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS builder_sections_updated_at ON builder_sections;
CREATE TRIGGER builder_sections_updated_at
  BEFORE UPDATE ON builder_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

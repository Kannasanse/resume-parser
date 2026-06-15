-- Add spacing, footer, and layout settings columns to builder_resumes
ALTER TABLE builder_resumes
  ADD COLUMN IF NOT EXISTS spacing_settings JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS footer_settings   JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS layout_settings   JSONB DEFAULT '{}';

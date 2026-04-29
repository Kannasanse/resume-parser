-- Run this in Supabase SQL Editor AFTER schema.sql

-- 1. Add job_id to resumes (nullable FK — resumes can exist without a job profile)
ALTER TABLE resumes
  ADD COLUMN IF NOT EXISTS job_id UUID REFERENCES job_profiles(id) ON DELETE SET NULL;

-- 2. Add scoring metadata columns to job_profiles
ALTER TABLE job_profiles
  ADD COLUMN IF NOT EXISTS role_type TEXT DEFAULT 'technical'
    CHECK (role_type IN ('technical', 'entry-level', 'specialized')),
  ADD COLUMN IF NOT EXISTS seniority TEXT DEFAULT 'mid'
    CHECK (seniority IN ('senior', 'mid', 'junior', 'entry')),
  ADD COLUMN IF NOT EXISTS required_years_experience INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS required_degree TEXT DEFAULT 'None'
    CHECK (required_degree IN ('PhD', 'Masters', 'Bachelors', 'Associates', 'HS', 'None')),
  ADD COLUMN IF NOT EXISTS required_field TEXT,
  ADD COLUMN IF NOT EXISTS required_certs TEXT[] DEFAULT '{}';

-- 3. Add custom_weights to job_profiles (allows per-job weight overrides)
ALTER TABLE job_profiles
  ADD COLUMN IF NOT EXISTS custom_weights JSONB DEFAULT NULL;

-- 4. Create resume_scores table
CREATE TABLE IF NOT EXISTS resume_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  job_profile_id UUID REFERENCES job_profiles(id) ON DELETE CASCADE,
  overall_score FLOAT NOT NULL,
  band TEXT,
  skills_score FLOAT,
  experience_score FLOAT,
  education_score FLOAT,
  title_score FLOAT,
  certs_score FLOAT,
  projects_score FLOAT,
  quality_score FLOAT,
  candidate_years FLOAT,
  weights_used JSONB,
  breakdown JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(resume_id, job_profile_id)
);

-- 4b. Add scored_at to resume_scores (separate ALTER so it applies when table already exists)
ALTER TABLE resume_scores ADD COLUMN IF NOT EXISTS scored_at TIMESTAMPTZ;
UPDATE resume_scores SET scored_at = created_at WHERE scored_at IS NULL;

-- 5. Organizations lookup table
CREATE TABLE IF NOT EXISTS organizations (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name       TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Add organization reference to job_profiles (optional)
ALTER TABLE job_profiles
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL;

-- 7. Add AI score summary to resume_scores
ALTER TABLE resume_scores ADD COLUMN IF NOT EXISTS score_summary JSONB DEFAULT NULL;

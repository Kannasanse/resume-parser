-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT,
  raw_text TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parsed_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_id UUID REFERENCES resumes(id) ON DELETE CASCADE,
  candidate_name TEXT,
  email TEXT,
  phone TEXT,
  summary TEXT,
  skills TEXT[],
  raw_json JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS work_experience (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parsed_data_id UUID REFERENCES parsed_data(id) ON DELETE CASCADE,
  company TEXT,
  title TEXT,
  start_date TEXT,
  end_date TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parsed_data_id UUID REFERENCES parsed_data(id) ON DELETE CASCADE,
  institution TEXT,
  degree TEXT,
  field TEXT,
  graduation_year TEXT
);

CREATE TABLE IF NOT EXISTS job_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_profile_id UUID REFERENCES job_profiles(id) ON DELETE CASCADE,
  skill TEXT NOT NULL,
  proficiency TEXT CHECK (proficiency IN ('Expert', 'Advanced', 'Intermediate', 'Beginner', 'Nice-to-have')),
  is_required BOOLEAN DEFAULT true
);

-- Auto-update updated_at on resumes
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS resumes_updated_at ON resumes;
CREATE TRIGGER resumes_updated_at
  BEFORE UPDATE ON resumes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS job_profiles_updated_at ON job_profiles;
CREATE TRIGGER job_profiles_updated_at
  BEFORE UPDATE ON job_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

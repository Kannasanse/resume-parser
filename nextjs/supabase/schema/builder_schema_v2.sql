-- Run this in Supabase SQL Editor after builder_schema.sql

-- Add public share support to builder_resumes
ALTER TABLE builder_resumes
  ADD COLUMN IF NOT EXISTS share_token UUID DEFAULT gen_random_uuid(),
  ADD COLUMN IF NOT EXISTS share_enabled BOOLEAN DEFAULT false;

-- Unique index on share_token for fast lookups
CREATE UNIQUE INDEX IF NOT EXISTS builder_resumes_share_token_idx
  ON builder_resumes(share_token);

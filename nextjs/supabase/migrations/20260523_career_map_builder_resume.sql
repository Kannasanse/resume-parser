-- Ensure career_map_sessions.resume_id can reference builder_resumes
-- (column may already exist pointing at uploaded resumes table)
-- We make it nullable and add no FK constraint since it may point to either table

alter table career_map_sessions
  add column if not exists resume_id uuid;

-- Index for last-used resume lookup
create index if not exists idx_career_map_sessions_user_created
  on career_map_sessions (user_id, created_at desc);

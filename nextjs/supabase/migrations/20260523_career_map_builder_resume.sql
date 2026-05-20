-- Add a separate column for builder resume references so we don't
-- violate the existing FK on resume_id (which references public.resumes)
alter table career_map_sessions
  add column if not exists builder_resume_id uuid references public.builder_resumes(id) on delete set null;

create index if not exists idx_career_map_sessions_user_created
  on career_map_sessions (user_id, created_at desc);

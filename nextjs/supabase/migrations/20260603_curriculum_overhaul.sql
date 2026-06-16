-- Course Generation Overhaul: add topic-level curriculum fields

alter table public.study_plan_topics
  add column if not exists estimated_minutes integer not null default 0,
  add column if not exists prerequisites     text[]  not null default '{}',
  add column if not exists real_world_application text;

-- study_plans: allow target_role_id to be nullable for skill-only plans
alter table public.study_plans
  alter column target_role_id drop not null;

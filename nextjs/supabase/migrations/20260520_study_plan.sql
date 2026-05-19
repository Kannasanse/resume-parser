-- Study Plan tables

create table if not exists public.study_plans (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  session_id        uuid references public.career_map_sessions(id) on delete cascade,
  target_role_id    text not null,
  target_role_title text not null,
  missing_skills    text[] not null default '{}',
  preferences       jsonb not null default '{}',
  plan_structure    jsonb not null default '{}',
  total_weeks       integer not null default 0,
  total_hours       integer not null default 0,
  status            text not null default 'active',
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.study_plan_topics (
  id                uuid primary key default gen_random_uuid(),
  study_plan_id     uuid not null references public.study_plans(id) on delete cascade,
  week_number       integer not null,
  topic_order       integer not null,
  skill             text not null,
  title             text not null,
  description       text,
  estimated_hours   numeric not null default 0,
  sections          jsonb not null default '[]',
  youtube_queries   text[] default '{}',
  youtube_videos    jsonb not null default '[]',
  completion_status jsonb not null default '{}',
  is_completed      boolean not null default false,
  completed_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.study_plan_progress (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  topic_id     uuid not null references public.study_plan_topics(id) on delete cascade,
  section_id   text not null,
  is_completed boolean not null default false,
  completed_at timestamptz,
  unique(user_id, topic_id, section_id)
);

-- Indexes
create index if not exists study_plans_user_id_idx on public.study_plans(user_id);
create index if not exists study_plan_topics_plan_id_idx on public.study_plan_topics(study_plan_id);
create index if not exists study_plan_progress_topic_id_idx on public.study_plan_progress(topic_id);
create index if not exists study_plan_progress_user_id_idx on public.study_plan_progress(user_id);

-- RLS
alter table public.study_plans enable row level security;
alter table public.study_plan_topics enable row level security;
alter table public.study_plan_progress enable row level security;

drop policy if exists "owner_study_plans" on public.study_plans;
create policy "owner_study_plans" on public.study_plans
  for all using (auth.uid() = user_id);

drop policy if exists "owner_study_plan_topics" on public.study_plan_topics;
create policy "owner_study_plan_topics" on public.study_plan_topics
  for all using (
    study_plan_id in (select id from public.study_plans where user_id = auth.uid())
  );

drop policy if exists "owner_study_plan_progress" on public.study_plan_progress;
create policy "owner_study_plan_progress" on public.study_plan_progress
  for all using (auth.uid() = user_id);

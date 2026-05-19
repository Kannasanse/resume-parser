-- Career Map tables

create table if not exists public.career_map_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users(id) on delete cascade,
  resume_id         uuid references public.resumes(id) on delete set null,
  questionnaire     jsonb not null default '{}',
  extracted_profile jsonb not null default '{}',
  recommended_roles jsonb not null default '[]',
  selected_role_id  text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists public.career_role_database (
  id               text primary key,
  title            text not null,
  category         text not null,
  seniority        text not null,
  required_skills  text[] not null default '{}',
  core_skills      text[] not null default '{}',
  salary_min_usd   integer,
  salary_max_usd   integer,
  avg_years_exp    numeric,
  vertical_next    text[] not null default '{}',
  horizontal_peers text[] not null default '{}',
  diagonal_options text[] not null default '{}',
  description      text,
  growth_outlook   text default 'Medium',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create table if not exists public.career_map_paths (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid not null references public.career_map_sessions(id) on delete cascade,
  selected_role_id text references public.career_role_database(id),
  graph_data       jsonb not null default '{}',
  skill_gap_data   jsonb not null default '{}',
  computed_at      timestamptz not null default now()
);

-- Indexes
create index if not exists career_map_sessions_user_id_idx on public.career_map_sessions(user_id);
create index if not exists career_map_paths_session_id_idx on public.career_map_paths(session_id);

-- RLS
alter table public.career_map_sessions   enable row level security;
alter table public.career_role_database  enable row level security;
alter table public.career_map_paths      enable row level security;

drop policy if exists "owner_career_map_sessions" on public.career_map_sessions;
create policy "owner_career_map_sessions" on public.career_map_sessions
  for all using (auth.uid() = user_id);

drop policy if exists "public_read_career_roles" on public.career_role_database;
create policy "public_read_career_roles" on public.career_role_database
  for select using (true);

drop policy if exists "owner_career_map_paths" on public.career_map_paths;
create policy "owner_career_map_paths" on public.career_map_paths
  for all using (
    session_id in (select id from public.career_map_sessions where user_id = auth.uid())
  );

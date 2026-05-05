-- Self-Test Schema — run in Supabase SQL Editor

-- ─── self_test_sessions ───────────────────────────────────────────────────────
create table if not exists public.self_test_sessions (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users(id) on delete cascade,
  input_type     text not null check (input_type in ('skills', 'content')),
  input_data     text not null,
  difficulty     text not null check (difficulty in ('easy', 'medium', 'hard')),
  timer_minutes  int  not null check (timer_minutes between 5 and 180),
  questions      jsonb not null default '[]',
  question_count int  not null default 0,
  status         text not null default 'ready'
                   check (status in ('ready', 'active', 'completed')),
  created_at     timestamptz not null default now(),
  expires_at     timestamptz not null default (now() + interval '24 hours')
);

alter table public.self_test_sessions enable row level security;
drop policy if exists "Users manage own self-test sessions" on public.self_test_sessions;
create policy "Users manage own self-test sessions" on public.self_test_sessions
  for all using (auth.uid() = user_id);

-- ─── self_test_attempts ───────────────────────────────────────────────────────
create table if not exists public.self_test_attempts (
  id                     uuid primary key default gen_random_uuid(),
  session_id             uuid not null references public.self_test_sessions(id) on delete cascade,
  user_id                uuid not null references auth.users(id) on delete cascade,
  started_at             timestamptz not null default now(),
  submitted_at           timestamptz,
  time_remaining_seconds int,
  auto_submitted         boolean not null default false,
  answers                jsonb not null default '{}',
  results                jsonb not null default '[]',
  score                  numeric(6,2),
  max_score              int,
  created_at             timestamptz not null default now()
);

alter table public.self_test_attempts enable row level security;
drop policy if exists "Users manage own self-test attempts" on public.self_test_attempts;
create policy "Users manage own self-test attempts" on public.self_test_attempts
  for all using (auth.uid() = user_id);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_self_test_sessions_user    on public.self_test_sessions(user_id);
create index if not exists idx_self_test_sessions_status  on public.self_test_sessions(status);
create index if not exists idx_self_test_attempts_session on public.self_test_attempts(session_id);
create index if not exists idx_self_test_attempts_user    on public.self_test_attempts(user_id);

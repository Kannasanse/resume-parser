-- Test Management Schema — run in Supabase SQL Editor after rbac_schema.sql

-- ─── tests ───────────────────────────────────────────────────────────────────
create table if not exists public.tests (
  id                     uuid primary key default gen_random_uuid(),
  title                  text not null,
  description            text,
  job_profile_id         uuid references public.job_profiles(id) on delete set null,
  timer_enabled          boolean not null default false,
  time_limit_minutes     int not null default 30 check (time_limit_minutes > 0),
  disable_copy_paste     boolean not null default false,
  tab_switch_monitoring  boolean not null default false,
  tab_switch_threshold   int not null default 3 check (tab_switch_threshold between 1 and 10),
  tab_switch_action      text not null default 'flag' check (tab_switch_action in ('flag', 'auto_submit')),
  status                 text not null default 'draft'
                           check (status in ('draft', 'published', 'archived')),
  created_by             uuid references auth.users(id) on delete set null,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

alter table public.tests enable row level security;
-- Admins access via service role only

-- ─── test_questions ───────────────────────────────────────────────────────────
create table if not exists public.test_questions (
  id             uuid primary key default gen_random_uuid(),
  test_id        uuid not null references public.tests(id) on delete cascade,
  type           text not null check (type in ('mcq', 'true_false', 'short_answer')),
  question_text  text not null,
  position       int not null default 0,
  points         int not null default 1 check (points >= 0),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

alter table public.test_questions enable row level security;

-- ─── test_options ─────────────────────────────────────────────────────────────
create table if not exists public.test_options (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.test_questions(id) on delete cascade,
  option_text  text not null,
  is_correct   boolean not null default false,
  position     int not null default 0
);

alter table public.test_options enable row level security;

-- ─── test_links ───────────────────────────────────────────────────────────────
create table if not exists public.test_links (
  id               uuid primary key default gen_random_uuid(),
  test_id          uuid not null references public.tests(id) on delete cascade,
  recipient_email  text not null,
  recipient_name   text not null default '',
  token            text not null unique,
  status           text not null default 'pending'
                     check (status in ('pending', 'in_progress', 'completed', 'expired', 'revoked')),
  expires_at       timestamptz,
  created_by       uuid references auth.users(id) on delete set null,
  created_at       timestamptz not null default now()
);

alter table public.test_links enable row level security;
-- Anonymous test-takers read their own link by token
drop policy if exists "Anyone reads test link by token" on public.test_links;
create policy "Anyone reads test link by token" on public.test_links
  for select using (true);

-- ─── test_attempts ────────────────────────────────────────────────────────────
create table if not exists public.test_attempts (
  id                     uuid primary key default gen_random_uuid(),
  test_link_id           uuid not null references public.test_links(id) on delete cascade,
  started_at             timestamptz not null default now(),
  submitted_at           timestamptz,
  time_remaining_seconds int,
  auto_submitted         boolean not null default false,
  flagged                boolean not null default false,
  score                  numeric(6,2),
  max_score              int,
  graded_at              timestamptz,
  graded_by              uuid references auth.users(id) on delete set null
);

alter table public.test_attempts enable row level security;
drop policy if exists "Anyone manages their attempt" on public.test_attempts;
create policy "Anyone manages their attempt" on public.test_attempts
  for all using (true);

-- ─── test_responses ───────────────────────────────────────────────────────────
create table if not exists public.test_responses (
  id                 uuid primary key default gen_random_uuid(),
  attempt_id         uuid not null references public.test_attempts(id) on delete cascade,
  question_id        uuid not null references public.test_questions(id) on delete cascade,
  selected_option_id uuid references public.test_options(id) on delete set null,
  text_response      text,
  is_correct         boolean,
  points_awarded     numeric(6,2) not null default 0,
  unique(attempt_id, question_id)
);

alter table public.test_responses enable row level security;
drop policy if exists "Anyone manages their responses" on public.test_responses;
create policy "Anyone manages their responses" on public.test_responses
  for all using (true);

-- ─── test_integrity_events ────────────────────────────────────────────────────
create table if not exists public.test_integrity_events (
  id          bigint generated always as identity primary key,
  attempt_id  uuid not null references public.test_attempts(id) on delete cascade,
  event_type  text not null check (event_type in (
                'tab_switch', 'copy_attempt', 'paste_attempt',
                'right_click', 'focus_lost', 'focus_regained', 'threshold_reached'
              )),
  occurred_at timestamptz not null default now()
);

alter table public.test_integrity_events enable row level security;
drop policy if exists "Anyone inserts integrity events" on public.test_integrity_events;
create policy "Anyone inserts integrity events" on public.test_integrity_events
  for insert with check (true);
drop policy if exists "Admins read integrity events" on public.test_integrity_events;
create policy "Admins read integrity events" on public.test_integrity_events
  for select using (true);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_test_questions_test_id     on public.test_questions(test_id);
create index if not exists idx_test_options_question_id   on public.test_options(question_id);
create index if not exists idx_test_links_token           on public.test_links(token);
create index if not exists idx_test_links_test_id         on public.test_links(test_id);
create index if not exists idx_test_attempts_link_id      on public.test_attempts(test_link_id);
create index if not exists idx_test_responses_attempt_id  on public.test_responses(attempt_id);
create index if not exists idx_integrity_events_attempt   on public.test_integrity_events(attempt_id);

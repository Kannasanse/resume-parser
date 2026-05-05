-- Question Library Schema — run in Supabase SQL Editor after test_management_schema.sql

-- ─── question_library ─────────────────────────────────────────────────────────
create table if not exists public.question_library (
  id            uuid primary key default gen_random_uuid(),
  type          text not null check (type in ('mcq', 'true_false', 'short_answer')),
  question_text text not null,
  points        int not null default 1 check (points >= 0),
  skill_tag     text,
  topic         text,
  ai_generated  boolean not null default false,
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.question_library enable row level security;
-- Admins access via service role only

-- ─── question_library_options ─────────────────────────────────────────────────
create table if not exists public.question_library_options (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references public.question_library(id) on delete cascade,
  option_text  text not null,
  is_correct   boolean not null default false,
  position     int not null default 0
);

alter table public.question_library_options enable row level security;

-- ─── Link test_questions back to library source ────────────────────────────────
-- ON DELETE SET NULL: deleting a library question unlinks test copies (data preserved)
alter table public.test_questions
  add column if not exists library_question_id uuid
    references public.question_library(id) on delete set null;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_question_library_type       on public.question_library(type);
create index if not exists idx_question_library_skill      on public.question_library(skill_tag);
create index if not exists idx_question_library_ai         on public.question_library(ai_generated);
create index if not exists idx_ql_options_question_id      on public.question_library_options(question_id);
create index if not exists idx_test_questions_library_id   on public.test_questions(library_question_id);

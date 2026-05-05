-- Schema Migrations — run in Supabase SQL Editor for existing databases
-- Apply after test_management_schema.sql and question_library_schema.sql

-- ─── tests: integrity control columns ────────────────────────────────────────
alter table public.tests
  add column if not exists disable_copy_paste    boolean not null default false,
  add column if not exists tab_switch_monitoring boolean not null default false,
  add column if not exists tab_switch_threshold  int     not null default 3
    check (tab_switch_threshold between 1 and 10),
  add column if not exists tab_switch_action     text    not null default 'flag'
    check (tab_switch_action in ('flag', 'auto_submit'));

-- ─── test_attempts: flag column ───────────────────────────────────────────────
alter table public.test_attempts
  add column if not exists flagged boolean not null default false;

-- ─── question_library: difficulty column ─────────────────────────────────────
alter table public.question_library
  add column if not exists difficulty text
    check (difficulty in ('easy', 'medium', 'hard'));

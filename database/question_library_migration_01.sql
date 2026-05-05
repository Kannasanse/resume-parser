-- Question Library Migration 01 — run in Supabase SQL Editor
-- Adds difficulty column to question_library (for existing databases)

alter table public.question_library
  add column if not exists difficulty text
    check (difficulty in ('easy', 'medium', 'hard'));

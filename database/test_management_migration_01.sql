-- Migration 01: Add allow_copy_paste setting to tests table
-- Run in Supabase SQL Editor

alter table public.tests
  add column if not exists allow_copy_paste boolean not null default false;

-- Migration 02: Integrity Controls
-- Renames allow_copy_paste → disable_copy_paste (semantics flip: false = allowed)
-- Adds tab_switch_monitoring, tab_switch_threshold, tab_switch_action columns to tests
-- Adds flagged column to test_attempts

ALTER TABLE public.tests RENAME COLUMN allow_copy_paste TO disable_copy_paste;

-- Reset all rows to false (allowed) to match the new default semantics
UPDATE public.tests SET disable_copy_paste = false;

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS tab_switch_monitoring boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS tab_switch_threshold  int     NOT NULL DEFAULT 3
    CHECK (tab_switch_threshold BETWEEN 1 AND 10),
  ADD COLUMN IF NOT EXISTS tab_switch_action     text    NOT NULL DEFAULT 'flag'
    CHECK (tab_switch_action IN ('flag', 'auto_submit'));

ALTER TABLE public.test_attempts
  ADD COLUMN IF NOT EXISTS flagged boolean NOT NULL DEFAULT false;

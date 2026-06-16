-- Short Answer support for Interview Prep

-- self_test_sessions: track question type mix and grading preference
alter table self_test_sessions
  add column if not exists question_types    text[]  default array['mcq'],
  add column if not exists mcq_count         integer,
  add column if not exists short_answer_count integer,
  add column if not exists grading_method    text;  -- 'ai' | 'self' | 'per_question'

-- self_test_attempts: aggregate short-answer scoring fields
alter table self_test_attempts
  add column if not exists short_answer_score   numeric(5,2) default 0,
  add column if not exists self_graded_score    integer      default 0,
  add column if not exists short_answer_count   integer      default 0,
  add column if not exists combined_score       numeric(5,2),
  add column if not exists combined_pct         numeric(5,2);

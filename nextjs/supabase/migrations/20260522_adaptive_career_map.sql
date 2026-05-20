-- Adaptive Career Map Questionnaire

alter table career_map_sessions
  add column if not exists questionnaire_version  text    default 'adaptive',
  add column if not exists question_count         integer default 0,
  add column if not exists confidence_score       numeric(4,3),
  add column if not exists questionnaire_complete boolean default false;

create table if not exists career_map_questions (
  id               uuid primary key default gen_random_uuid(),
  session_id       uuid references career_map_sessions(id) on delete cascade,
  question_number  integer not null,
  question_text    text    not null,
  question_type    text    not null,  -- 'options' | 'free_text'
  question_intent  text    not null,
  options          jsonb,
  answer_value     text,
  answer_label     text,
  confidence_after numeric(4,3),
  should_continue  boolean,
  created_at       timestamptz default now(),
  answered_at      timestamptz,
  unique(session_id, question_number)
);

alter table career_map_questions enable row level security;

create policy "Owner only"
  on career_map_questions for all
  using (
    session_id in (select id from career_map_sessions where user_id = auth.uid())
  );

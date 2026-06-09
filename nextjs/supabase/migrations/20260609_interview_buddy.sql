-- Interview kits table for Interview Buddy feature
create table if not exists interview_kits (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  title          text not null,
  company        text,
  role_level     text,
  depth          text,
  jd_text        text not null,
  categories     text[] not null default '{}',
  questions      jsonb not null default '[]',
  question_count integer,
  created_at     timestamptz not null default now(),
  last_viewed_at timestamptz
);

create index if not exists idx_interview_kits_user
  on interview_kits (user_id, created_at desc);

alter table interview_kits enable row level security;

create policy "interview_kits_owner_only"
  on interview_kits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

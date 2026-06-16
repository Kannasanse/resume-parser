-- Course workspace: sources, chat, study guides

create table if not exists course_sources (
  id              uuid primary key default gen_random_uuid(),
  course_id       uuid references study_plans(id) on delete cascade not null,
  user_id         uuid references auth.users(id) on delete cascade not null,
  type            text not null check (type in ('pdf','url','text','web','ai','youtube')),
  title           text not null,
  subtitle        text,
  url             text,
  file_path       text,
  extracted_text  text,
  token_count     integer,
  metadata        jsonb not null default '{}',
  created_at      timestamptz not null default now()
);

create index if not exists idx_course_sources_course
  on course_sources (course_id, created_at desc);

create table if not exists course_chat_messages (
  id          uuid primary key default gen_random_uuid(),
  course_id   uuid references study_plans(id) on delete cascade not null,
  user_id     uuid references auth.users(id) on delete cascade not null,
  role        text not null check (role in ('user','assistant')),
  content     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists idx_course_chat_course
  on course_chat_messages (course_id, created_at);

create table if not exists course_study_guides (
  course_id    uuid primary key references study_plans(id) on delete cascade,
  user_id      uuid references auth.users(id) on delete cascade not null,
  content      text not null,
  source_ids   uuid[] not null default '{}',
  generated_at timestamptz not null default now()
);

alter table course_sources       enable row level security;
alter table course_chat_messages enable row level security;
alter table course_study_guides  enable row level security;

create policy "course_sources_owner"
  on course_sources for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "course_chat_owner"
  on course_chat_messages for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "course_study_guides_owner"
  on course_study_guides for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

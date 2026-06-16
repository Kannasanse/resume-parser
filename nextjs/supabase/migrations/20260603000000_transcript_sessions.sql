-- Stores real-time chunk transcripts from the Chrome extension
create table if not exists transcript_sessions (
  id           uuid primary key default gen_random_uuid(),
  session_id   text not null unique,
  user_id      uuid references auth.users(id) on delete cascade,
  chunks       jsonb not null default '[]',
  -- Array of { index, text, segments[] } — one entry per 10-second audio chunk
  full_text    text,
  -- Assembled after session ends (optional post-processing)
  language     text,
  source_url   text,
  source_title text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

alter table transcript_sessions enable row level security;

create policy "Users can manage their own sessions"
  on transcript_sessions
  for all
  using (auth.uid() = user_id);

create index idx_transcript_sessions_user
  on transcript_sessions (user_id, created_at desc);

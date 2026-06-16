-- YouTube video cache for Career Map study plan sections
create table if not exists youtube_video_cache (
  id            uuid        primary key default gen_random_uuid(),
  query_hash    text        not null unique,
  query_text    text        not null,
  video_id      text        not null,
  video_data    jsonb       not null,
  skill         text,
  section_title text,
  hit_count     integer     not null default 0,
  cached_at     timestamptz not null default now(),
  expires_at    timestamptz not null
);

create index if not exists idx_youtube_cache_hash    on youtube_video_cache (query_hash);
create index if not exists idx_youtube_cache_expires on youtube_video_cache (expires_at);
create index if not exists idx_youtube_cache_skill   on youtube_video_cache (skill);

alter table youtube_video_cache enable row level security;
-- Only service-role (server-side) can read/write; no user-facing RLS policies needed.

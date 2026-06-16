-- portfolio_analytics
create table if not exists portfolio_analytics (
  id            uuid primary key default gen_random_uuid(),
  portfolio_id  uuid references portfolios(id) on delete cascade,
  event_type    text not null,    -- 'page_view' | 'project_click' | 'form_submit'
  referrer      text,             -- 'direct' | 'linkedin' | 'google' | 'github' | 'twitter' | 'other'
  project_id    uuid references portfolio_projects(id) on delete set null,
  country_code  text,
  created_at    timestamptz default now()
);

alter table portfolio_analytics enable row level security;
create policy "Owner can read their analytics"
  on portfolio_analytics for select
  using (portfolio_id in (select id from portfolios where user_id = auth.uid()));
-- Insert is open (no RLS on insert — done via service role from API)

create index if not exists idx_portfolio_analytics_portfolio_id on portfolio_analytics(portfolio_id);
create index if not exists idx_portfolio_analytics_created_at on portfolio_analytics(created_at);

-- user_integrations
create table if not exists user_integrations (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade,
  provider      text not null,
  provider_uid  text,
  access_token  text,
  refresh_token text,
  scopes        text[],
  connected_at  timestamptz default now(),
  last_synced   timestamptz,
  unique(user_id, provider)
);

alter table user_integrations enable row level security;
create policy "Owner full access on user_integrations"
  on user_integrations for all using (auth.uid() = user_id);

-- ai_usage tracking
create table if not exists ai_usage (
  id        uuid primary key default gen_random_uuid(),
  user_id   uuid references auth.users(id) on delete cascade,
  feature   text not null,
  used_at   timestamptz default now()
);

alter table ai_usage enable row level security;
create policy "Owner can read their ai_usage"
  on ai_usage for select using (auth.uid() = user_id);

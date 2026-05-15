-- portfolios table
create table if not exists portfolios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  resume_id uuid references resumes(id) on delete set null,
  name text not null default 'My Portfolio',
  slug text unique,
  status text not null default 'draft',
  template_id text not null default 'minimal',
  customisation jsonb default '{}',
  is_linked_to_resume boolean default false,
  meta_title text,
  meta_description text,
  og_image_url text,
  password_hash text,
  is_indexed boolean default true,
  view_count integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  published_at timestamptz
);

-- portfolio_sections table
create table if not exists portfolio_sections (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  section_type text not null,
  sort_order integer not null,
  is_visible boolean default true,
  content jsonb default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- portfolio_projects table
create table if not exists portfolio_projects (
  id uuid primary key default gen_random_uuid(),
  portfolio_id uuid references portfolios(id) on delete cascade,
  title text not null,
  tagline text,
  description text,
  cover_image_url text,
  project_url text,
  source_url text,
  tech_stack text[],
  my_role text,
  role_type text,
  start_date date,
  end_date date,
  is_ongoing boolean default false,
  category text,
  is_featured boolean default false,
  is_case_study boolean default false,
  visibility text default 'public',
  status text default 'completed',
  media_gallery jsonb default '[]',
  outcomes jsonb default '[]',
  team_size integer,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS policies
alter table portfolios enable row level security;
drop policy if exists "Owner full access on portfolios" on portfolios;
create policy "Owner full access on portfolios" on portfolios for all using (auth.uid() = user_id);
drop policy if exists "Public read published portfolios" on portfolios;
create policy "Public read published portfolios" on portfolios for select using (status = 'published');

alter table portfolio_sections enable row level security;
drop policy if exists "Owner full access on portfolio_sections" on portfolio_sections;
create policy "Owner full access on portfolio_sections" on portfolio_sections for all using (portfolio_id in (select id from portfolios where user_id = auth.uid()));
drop policy if exists "Public read visible sections" on portfolio_sections;
create policy "Public read visible sections" on portfolio_sections for select using (is_visible = true and portfolio_id in (select id from portfolios where status = 'published'));

alter table portfolio_projects enable row level security;
drop policy if exists "Owner full access on portfolio_projects" on portfolio_projects;
create policy "Owner full access on portfolio_projects" on portfolio_projects for all using (portfolio_id in (select id from portfolios where user_id = auth.uid()));
drop policy if exists "Public read non-private projects" on portfolio_projects;
create policy "Public read non-private projects" on portfolio_projects for select using (visibility != 'private' and portfolio_id in (select id from portfolios where status = 'published'));

-- Indexes
create index if not exists idx_portfolios_user_id on portfolios(user_id);
create index if not exists idx_portfolios_slug on portfolios(slug);
create index if not exists idx_portfolio_sections_portfolio_id on portfolio_sections(portfolio_id);
create index if not exists idx_portfolio_projects_portfolio_id on portfolio_projects(portfolio_id);

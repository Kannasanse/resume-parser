-- Separate city/country columns on profiles (more precise than the generic location string)
alter table public.profiles
  add column if not exists headline text,
  add column if not exists city     text,
  add column if not exists country  text;

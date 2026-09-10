-- ==============================================================================
-- ⚡ STREAK: SUPABASE PRODUCTION DATABASE SCHEMA & REALTIME SETUP
-- ==============================================================================
-- Instructions:
-- 1. Open your Supabase Dashboard: https://supabase.com/dashboard/project/_/sql
-- 2. Paste the entire SQL script below into the SQL Editor.
-- 3. Click "RUN" to execute and initialize all tables, RLS policies, and realtime replication.
-- ==============================================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. 👤 USER PROFILES TABLE
create table if not exists public.user_profiles (
  id text primary key,                             -- User ID (Supabase Auth UID, email key, or custom ID)
  uid text,
  email text,
  name text default 'Hunter',
  avatar_url text default '/images/char_hero.jpg',
  header_image text,                              -- Custom Header banner image
  daily_mantra_image text,                        -- Custom Daily Mantra photo
  hunter_rank text default 'E',
  level integer default 0,
  current_xp integer default 0,
  overall_streak integer default 0,
  longest_streak integer default 0,
  efficiency_pct numeric default 0,
  age integer,
  blood_group text,
  height text,
  weight text,
  resident text,
  phone_number text,
  bio text,
  last_active_date text,
  last_synced_at timestamptz,
  sync_status text default 'idle',
  platform_stats jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Safely add newly introduced columns if user_profiles table already exists
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name='header_image') then
    alter table public.user_profiles add column header_image text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name='daily_mantra_image') then
    alter table public.user_profiles add column daily_mantra_image text;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name='last_synced_at') then
    alter table public.user_profiles add column last_synced_at timestamptz;
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name='sync_status') then
    alter table public.user_profiles add column sync_status text default 'idle';
  end if;
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_profiles' and column_name='platform_stats') then
    alter table public.user_profiles add column platform_stats jsonb default '{}'::jsonb;
  end if;
end $$;

-- 2. ⚡ USER FULL APPLICATION STATE TABLE (Habits, Matrix, Directives, Logs)
create table if not exists public.user_state (
  user_id text primary key,
  activities jsonb default '[]'::jsonb,
  matrix_state jsonb default '{}'::jsonb,
  emergency_tasks jsonb default '[]'::jsonb,
  logs jsonb default '[]'::jsonb,
  xp integer default 0,
  level integer default 0,
  overall_streak integer default 0,
  longest_streak integer default 0,
  efficiency_pct numeric default 0,
  updated_at timestamptz default now()
);

-- Safely add logs column if user_state table already exists
do $$
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='user_state' and column_name='logs') then
    alter table public.user_state add column logs jsonb default '[]'::jsonb;
  end if;
end $$;

-- 3. 📝 DETAILED ACTIVITY LOGS TABLE
create table if not exists public.activity_logs (
  id text primary key,
  user_id text not null,
  date text not null,
  activity_id text not null,
  activity_name text,
  category text,
  timestamp bigint not null,
  xp_earned integer default 0,
  source text default 'manual',
  is_auto_detected boolean default false,
  notes text,
  created_at timestamptz default now()
);

-- 4. 🧩 CUSTOM PLATFORMS CONFIG TABLE
create table if not exists public.custom_platforms (
  id text primary key,
  user_id text not null,
  name text not null,
  icon text default 'Activity',
  color text default '#3B82F6',
  category text default 'Custom',
  target_count integer default 1,
  unit text default 'units',
  created_at timestamptz default now()
);

-- 5. 🔗 PLATFORM INTEGRATION CACHE TABLE
create table if not exists public.integration_cache (
  user_id text not null,
  platform text not null,
  data_json jsonb not null default '{}'::jsonb,
  synced_at timestamptz default now(),
  primary key (user_id, platform)
);

-- ==============================================================================
-- 🔒 ROW-LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.user_profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.activity_logs enable row level security;
alter table public.custom_platforms enable row level security;
alter table public.integration_cache enable row level security;

-- Drop existing policies if rerun to prevent collision errors
drop policy if exists "user_profiles_all_policy" on public.user_profiles;
drop policy if exists "user_state_all_policy" on public.user_state;
drop policy if exists "activity_logs_all_policy" on public.activity_logs;
drop policy if exists "custom_platforms_all_policy" on public.custom_platforms;
drop policy if exists "integration_cache_all_policy" on public.integration_cache;

-- Universal full-access policies (supports anon client sync + authenticated accounts)
create policy "user_profiles_all_policy"
  on public.user_profiles for all
  using (true) with check (true);

create policy "user_state_all_policy"
  on public.user_state for all
  using (true) with check (true);

create policy "activity_logs_all_policy"
  on public.activity_logs for all
  using (true) with check (true);

create policy "custom_platforms_all_policy"
  on public.custom_platforms for all
  using (true) with check (true);

create policy "integration_cache_all_policy"
  on public.integration_cache for all
  using (true) with check (true);

-- ==============================================================================
-- 📡 REALTIME SUBSCRIPTION REPLICATION
-- ==============================================================================

-- Enable instant bidirectional websocket push & broadcast across devices
do $$
begin
  begin
    alter publication supabase_realtime add table public.user_profiles;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.user_state;
  exception when duplicate_object then null;
  end;
  begin
    alter publication supabase_realtime add table public.activity_logs;
  exception when duplicate_object then null;
  end;
end $$;

-- Verify setup
select 'Supabase tables and realtime replication configured successfully!' as status;

-- ==============================================================================
-- EffectiveStreak Supabase Schema & Row-Level Security (RLS) Setup
-- ==============================================================================
-- Run this SQL in your Supabase Dashboard -> SQL Editor to initialize cloud storage

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Users / Profiles Table
create table if not exists public.user_profiles (
  id text primary key,                    -- User ID (Supabase Auth UID or custom ID)
  uid text,
  email text,
  name text default 'Hunter',
  avatar_url text default '/images/char_hero.jpg',
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
  updated_at timestamptz default now()
);

-- 2. User State Table (Activities, Daily Matrix, Emergency Tasks)
create table if not exists public.user_state (
  user_id text primary key references public.user_profiles(id) on delete cascade,
  activities jsonb default '[]'::jsonb,
  matrix_state jsonb default '{}'::jsonb,
  emergency_tasks jsonb default '[]'::jsonb,
  xp integer default 0,
  level integer default 0,
  overall_streak integer default 0,
  longest_streak integer default 0,
  efficiency_pct numeric default 0,
  updated_at timestamptz default now()
);

-- 3. Activity Logs Table (Detailed timestamped activity logs)
create table if not exists public.activity_logs (
  id text primary key,
  user_id text not null,
  date text not null,
  activity_id text not null,
  activity_name text,
  timestamp bigint not null,
  xp_earned integer default 0,
  notes text,
  created_at timestamptz default now()
);

-- 4. Custom Platforms Config Table
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

-- Enable Row Level Security (RLS)
alter table public.user_profiles enable row level security;
alter table public.user_state enable row level security;
alter table public.activity_logs enable row level security;
alter table public.custom_platforms enable row level security;

-- Public/Authenticated Access Policies (Allow read/write by owner or anon for demo)
create policy "Allow all operations for authenticated users on user_profiles"
  on public.user_profiles for all
  using (true) with check (true);

create policy "Allow all operations for authenticated users on user_state"
  on public.user_state for all
  using (true) with check (true);

create policy "Allow all operations for authenticated users on activity_logs"
  on public.activity_logs for all
  using (true) with check (true);

create policy "Allow all operations for authenticated users on custom_platforms"
  on public.custom_platforms for all
  using (true) with check (true);

-- Enable Realtime publication for tables
alter publication supabase_realtime add table public.user_profiles;
alter publication supabase_realtime add table public.user_state;
alter publication supabase_realtime add table public.activity_logs;

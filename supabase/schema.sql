create extension if not exists "uuid-ossp";

-- Users (replaces players)
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  display_name text not null unique,
  pin_hash text not null,
  is_admin boolean not null default false,
  accent_colour text not null default '#C4122E',
  created_at timestamptz default now()
);

-- Teams
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  tier integer not null check (tier between 1 and 4),
  flag_emoji text not null,
  confederation text not null
);

-- Draft Picks (user_id → users.id)
create table if not exists draft_picks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade unique,
  pick_number integer not null,
  tier integer not null,
  picked_at timestamptz default now()
);

-- Team Points
create table if not exists team_points (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade,
  round text not null check (round in ('GW1','GW2','GW3','R32','R16','QF','SF','3PO','FINAL')),
  points integer not null default 0,
  updated_at timestamptz default now(),
  unique(team_id, round)
);

-- Audit Log
create table if not exists audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,
  action text not null,
  detail text,
  created_at timestamptz default now()
);

-- Realtime
alter publication supabase_realtime add table users;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table draft_picks;
alter publication supabase_realtime add table team_points;

-- RLS
alter table users enable row level security;
alter table teams enable row level security;
alter table draft_picks enable row level security;
alter table team_points enable row level security;
alter table audit_log enable row level security;

create policy "allow all users" on users for all using (true) with check (true);
create policy "allow all teams" on teams for all using (true) with check (true);
create policy "allow all draft_picks" on draft_picks for all using (true) with check (true);
create policy "allow all team_points" on team_points for all using (true) with check (true);
create policy "allow all audit_log" on audit_log for all using (true) with check (true);

-- Quiz
create table if not exists quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade unique,
  score integer not null default 0,
  correct_count integer not null default 0,
  completed_at timestamptz default now()
);

alter table quiz_results enable row level security;
create policy "allow all quiz_results" on quiz_results for all using (true) with check (true);
alter publication supabase_realtime add table quiz_results;

-- Draft position (set by admin after quiz)
alter table users add column if not exists draft_position integer;

-- CPFCMundial database schema
-- Run this in your Supabase SQL editor before seeding

create extension if not exists "uuid-ossp";

-- Players (6 participants)
create table if not exists players (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color_hex  text not null default '#C4122E',
  created_at timestamptz default now()
);

-- 48 World Cup teams split into 4 tiers
create table if not exists teams (
  id            uuid primary key default gen_random_uuid(),
  name          text not null unique,
  tier          integer not null check (tier between 1 and 4),
  flag_emoji    text not null,
  confederation text not null
);

-- Snake draft picks (48 total: 6 players × 8 teams each)
create table if not exists draft_picks (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid references players(id) on delete cascade,
  team_id     uuid references teams(id) on delete cascade unique,
  pick_number integer not null,
  picked_at   timestamptz default now()
);

-- Points earned by each team per round
create table if not exists team_points (
  id         uuid primary key default gen_random_uuid(),
  team_id    uuid references teams(id) on delete cascade,
  round      text not null check (round in ('GW1','GW2','GW3','R32','R16','QF','SF','3PO','FINAL')),
  points     integer not null default 0,
  updated_at timestamptz default now(),
  unique(team_id, round)
);

-- Enable Realtime for live leaderboard updates
alter publication supabase_realtime add table players;
alter publication supabase_realtime add table teams;
alter publication supabase_realtime add table draft_picks;
alter publication supabase_realtime add table team_points;

-- Row Level Security (open policies — tighten for production)
alter table players    enable row level security;
alter table teams      enable row level security;
alter table draft_picks enable row level security;
alter table team_points enable row level security;

create policy "allow all players"     on players     for all using (true) with check (true);
create policy "allow all teams"       on teams       for all using (true) with check (true);
create policy "allow all draft_picks" on draft_picks for all using (true) with check (true);
create policy "allow all team_points" on team_points for all using (true) with check (true);

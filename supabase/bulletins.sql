-- Bulletins: auto-generated, banter-laden match-day digests for the WhatsApp group.
-- Run this once in the Supabase SQL editor (it is additive — safe on an existing DB).

create table if not exists bulletins (
  id uuid primary key default gen_random_uuid(),
  -- Human label e.g. "Matchday 2 Bulletin" or "Day 4"
  title text not null,
  -- The full WhatsApp-ready message body (markdown-ish, emoji, copy-paste into the group)
  body text not null,
  -- Snapshot of standings at generation time: [{ user_id, display_name, points, rank }]
  -- Used to compute "movers since last bulletin" on the next run.
  stats_json jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bulletins_created_at_idx on bulletins (created_at desc);

-- Realtime + RLS (consistent with the rest of the schema — open for this friends game)
alter publication supabase_realtime add table bulletins;
alter table bulletins enable row level security;
create policy "allow all bulletins" on bulletins for all using (true) with check (true);

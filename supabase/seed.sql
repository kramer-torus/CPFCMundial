-- CPFCMundial seed data
-- Run AFTER schema.sql

-- 6 players (rename via Supabase dashboard or a future settings UI)
insert into players (name, color_hex) values
  ('Jake',  '#C4122E'),
  ('Tom',   '#1F3864'),
  ('Sarah', '#C9A84C'),
  ('Mike',  '#16A34A'),
  ('Chris', '#7C3AED'),
  ('Emma',  '#EA580C')
on conflict do nothing;

-- 48 teams across 4 tiers (12 per tier)
insert into teams (name, tier, flag_emoji, confederation) values
  -- Tier 1 – Elite (favourites)
  ('Brazil',       1, '🇧🇷', 'CONMEBOL'),
  ('France',       1, '🇫🇷', 'UEFA'),
  ('England',      1, '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA'),
  ('Argentina',    1, '🇦🇷', 'CONMEBOL'),
  ('Spain',        1, '🇪🇸', 'UEFA'),
  ('Germany',      1, '🇩🇪', 'UEFA'),
  ('Portugal',     1, '🇵🇹', 'UEFA'),
  ('Netherlands',  1, '🇳🇱', 'UEFA'),
  ('Uruguay',      1, '🇺🇾', 'CONMEBOL'),
  ('Belgium',      1, '🇧🇪', 'UEFA'),
  ('USA',          1, '🇺🇸', 'CONCACAF'),
  ('Colombia',     1, '🇨🇴', 'CONMEBOL'),
  -- Tier 2 – Contenders
  ('Croatia',      2, '🇭🇷', 'UEFA'),
  ('Denmark',      2, '🇩🇰', 'UEFA'),
  ('Switzerland',  2, '🇨🇭', 'UEFA'),
  ('Mexico',       2, '🇲🇽', 'CONCACAF'),
  ('Morocco',      2, '🇲🇦', 'CAF'),
  ('Senegal',      2, '🇸🇳', 'CAF'),
  ('Japan',        2, '🇯🇵', 'AFC'),
  ('Australia',    2, '🇦🇺', 'AFC'),
  ('Poland',       2, '🇵🇱', 'UEFA'),
  ('Ecuador',      2, '🇪🇨', 'CONMEBOL'),
  ('South Korea',  2, '🇰🇷', 'AFC'),
  ('Serbia',       2, '🇷🇸', 'UEFA'),
  -- Tier 3 – Dark Horses
  ('Canada',       3, '🇨🇦', 'CONCACAF'),
  ('Turkey',       3, '🇹🇷', 'UEFA'),
  ('Costa Rica',   3, '🇨🇷', 'CONCACAF'),
  ('Tunisia',      3, '🇹🇳', 'CAF'),
  ('Cameroon',     3, '🇨🇲', 'CAF'),
  ('Saudi Arabia', 3, '🇸🇦', 'AFC'),
  ('Ukraine',      3, '🇺🇦', 'UEFA'),
  ('Scotland',     3, '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA'),
  ('Austria',      3, '🇦🇹', 'UEFA'),
  ('Ghana',        3, '🇬🇭', 'CAF'),
  ('Panama',       3, '🇵🇦', 'CONCACAF'),
  ('Venezuela',    3, '🇻🇪', 'CONMEBOL'),
  -- Tier 4 – Underdogs
  ('Iran',         4, '🇮🇷', 'AFC'),
  ('Indonesia',    4, '🇮🇩', 'AFC'),
  ('Jamaica',      4, '🇯🇲', 'CONCACAF'),
  ('New Zealand',  4, '🇳🇿', 'OFC'),
  ('Albania',      4, '🇦🇱', 'UEFA'),
  ('Slovenia',     4, '🇸🇮', 'UEFA'),
  ('Bolivia',      4, '🇧🇴', 'CONMEBOL'),
  ('Honduras',     4, '🇭🇳', 'CONCACAF'),
  ('DR Congo',     4, '🇨🇩', 'CAF'),
  ('Guinea',       4, '🇬🇳', 'CAF'),
  ('Iraq',         4, '🇮🇶', 'AFC'),
  ('Paraguay',     4, '🇵🇾', 'CONMEBOL')
on conflict (name) do nothing;

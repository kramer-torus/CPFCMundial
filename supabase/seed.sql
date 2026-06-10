-- Default PINs: Kev=1234, Franks=2222, Kangars=3333, Jakob=2026 (admin),
--               Matty Eagles=5555, Bananaman=6666, Liam=7777, Manuel=8888
-- To change: UPDATE users SET pin_hash = encode(sha256('PIN'::bytea), 'hex') WHERE display_name = 'Name';
insert into users (display_name, pin_hash, is_admin, accent_colour) values
  ('Kev',          '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', false, '#C4122E'),
  ('Franks',       'edee29f882543b956620b26d0ee0e7e950399b1c4222f5de05e06425b4c995e9', false, '#3B82F6'),
  ('Kangars',      '318aee3fed8c9d040d35a7fc1fa776fb31303833aa2de885354ddf3d44d8fb69', false, '#C9A84C'),
  ('Jakob',        '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab', true,  '#10B981'),
  ('Matty Eagles', 'c1f330d0aff31c1c87403f1e4347bcc21aff7c179908723535f2b31723702525', false, '#F97316'),
  ('Bananaman',    'd7697570462f7562b83e81258de0f1e41832e98072e44c36ec8efec46786e24e', false, '#EAB308'),
  ('Liam',         '41c991eb6a66242c0454191244278183ce58cf4a6bcd372f799e4b9cc01886af', false, '#A855F7'),
  ('Manuel',       '2926a2731f4b312c08982cacf8061eb14bf65c1a87cc5d70e864e079c6220731', false, '#EC4899')
on conflict (display_name) do nothing;

-- 48 confirmed 2026 WC teams — 3 tiers of 16 (2 picks/tier/player)
insert into teams (name, tier, flag_emoji, confederation, fifa_group, fifa_ranking, is_debut) values
  -- TIER 1 — Elite (FIFA #1–16)
  ('France',               1, '🇫🇷', 'UEFA',      'I', 1,   false),
  ('Spain',                1, '🇪🇸', 'UEFA',      'H', 2,   false),
  ('Argentina',            1, '🇦🇷', 'CONMEBOL',  'J', 3,   false),
  ('England',              1, '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA',      'L', 4,   false),
  ('Portugal',             1, '🇵🇹', 'UEFA',      'K', 5,   false),
  ('Brazil',               1, '🇧🇷', 'CONMEBOL',  'C', 6,   false),
  ('Netherlands',          1, '🇳🇱', 'UEFA',      'F', 7,   false),
  ('Morocco',              1, '🇲🇦', 'CAF',       'C', 8,   false),
  ('Belgium',              1, '🇧🇪', 'UEFA',      'G', 9,   false),
  ('Germany',              1, '🇩🇪', 'UEFA',      'E', 10,  false),
  ('Croatia',              1, '🇭🇷', 'UEFA',      'L', 11,  false),
  ('Colombia',             1, '🇨🇴', 'CONMEBOL',  'K', 12,  false),
  ('Senegal',              1, '🇸🇳', 'CAF',       'I', 13,  false),
  ('Mexico',               1, '🇲🇽', 'CONCACAF',  'A', 14,  false),
  ('United States',        1, '🇺🇸', 'CONCACAF',  'D', 15,  false),
  ('Uruguay',              1, '🇺🇾', 'CONMEBOL',  'H', 16,  false),
  -- TIER 2 — Contenders (FIFA #17–32)
  ('Japan',                2, '🇯🇵', 'AFC',       'F', 17,  false),
  ('Switzerland',          2, '🇨🇭', 'UEFA',      'B', 18,  false),
  ('Iran',                 2, '🇮🇷', 'AFC',       'G', 19,  false),
  ('Austria',              2, '🇦🇹', 'UEFA',      'J', 20,  false),
  ('Ecuador',              2, '🇪🇨', 'CONMEBOL',  'E', 21,  false),
  ('South Korea',          2, '🇰🇷', 'AFC',       'A', 22,  false),
  ('Australia',            2, '🇦🇺', 'AFC',       'D', 23,  false),
  ('Egypt',                2, '🇪🇬', 'CAF',       'G', 24,  false),
  ('Canada',               2, '🇨🇦', 'CONCACAF',  'B', 25,  false),
  ('Ivory Coast',          2, '🇨🇮', 'CAF',       'E', 26,  false),
  ('Qatar',                2, '🇶🇦', 'AFC',       'B', 27,  false),
  ('Algeria',              2, '🇩🇿', 'CAF',       'J', 28,  false),
  ('Sweden',               2, '🇸🇪', 'UEFA',      'F', 29,  false),
  ('Tunisia',              2, '🇹🇳', 'CAF',       'F', 30,  false),
  ('Czechia',              2, '🇨🇿', 'UEFA',      'A', 31,  false),
  ('Turkey',               2, '🇹🇷', 'UEFA',      'D', 32,  false),
  -- TIER 3 — Dark Horses (FIFA #33–48)
  ('Norway',               3, '🇳🇴', 'UEFA',      'I', 33,  false),
  ('Scotland',             3, '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA',      'C', 34,  false),
  ('DR Congo',             3, '🇨🇩', 'CAF',       'K', 35,  false),
  ('Bosnia & Herzegovina', 3, '🇧🇦', 'UEFA',      'B', 36,  false),
  ('Panama',               3, '🇵🇦', 'CONCACAF',  'L', 48,  false),
  ('Saudi Arabia',         3, '🇸🇦', 'AFC',       'H', 50,  false),
  ('South Africa',         3, '🇿🇦', 'CAF',       'A', 55,  false),
  ('Iraq',                 3, '🇮🇶', 'AFC',       'I', 60,  false),
  ('Uzbekistan',           3, '🇺🇿', 'AFC',       'K', 65,  true),
  ('Paraguay',             3, '🇵🇾', 'CONMEBOL',  'D', 70,  false),
  ('Ghana',                3, '🇬🇭', 'CAF',       'L', 75,  false),
  ('Jordan',               3, '🇯🇴', 'AFC',       'J', 80,  true),
  ('Cape Verde',           3, '🇨🇻', 'CAF',       'H', 85,  true),
  ('Curacao',              3, '🇨🇼', 'CONCACAF',  'E', 90,  true),
  ('Haiti',                3, '🇭🇹', 'CONCACAF',  'C', 95,  false),
  ('New Zealand',          3, '🇳🇿', 'OFC',       'G', 100, false)
on conflict (name) do update set
  tier = excluded.tier,
  fifa_group = excluded.fifa_group,
  fifa_ranking = excluded.fifa_ranking,
  is_debut = excluded.is_debut;

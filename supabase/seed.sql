-- Seed Users
-- Default PINs: Kev=1234, Franks=2222, Kangars=3333, Jakob=2026 (admin)
-- To change a PIN: UPDATE users SET pin_hash = encode(sha256('YOURPIN'::bytea), 'hex') WHERE display_name = 'Name';
insert into users (display_name, pin_hash, is_admin, accent_colour) values
  ('Kev',     '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', false, '#C4122E'),
  ('Franks',  'edee29f882543b956620b26d0ee0e7e950399b1c4222f5de05e06425b4c995e9', false, '#3B82F6'),
  ('Kangars', '318aee3fed8c9d040d35a7fc1fa776fb31303833aa2de885354ddf3d44d8fb69', false, '#C9A84C'),
  ('Jakob',   '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab', true,  '#10B981')
on conflict (display_name) do nothing;

-- Seed Teams (all 48)
insert into teams (name, tier, flag_emoji, confederation) values
  ('Brazil', 1, '🇧🇷', 'CONMEBOL'),
  ('France', 1, '🇫🇷', 'UEFA'),
  ('England', 1, '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA'),
  ('Argentina', 1, '🇦🇷', 'CONMEBOL'),
  ('Spain', 1, '🇪🇸', 'UEFA'),
  ('Germany', 1, '🇩🇪', 'UEFA'),
  ('Portugal', 1, '🇵🇹', 'UEFA'),
  ('Netherlands', 1, '🇳🇱', 'UEFA'),
  ('Uruguay', 1, '🇺🇾', 'CONMEBOL'),
  ('Belgium', 1, '🇧🇪', 'UEFA'),
  ('USA', 1, '🇺🇸', 'CONCACAF'),
  ('Colombia', 1, '🇨🇴', 'CONMEBOL'),
  ('Croatia', 2, '🇭🇷', 'UEFA'),
  ('Denmark', 2, '🇩🇰', 'UEFA'),
  ('Switzerland', 2, '🇨🇭', 'UEFA'),
  ('Mexico', 2, '🇲🇽', 'CONCACAF'),
  ('Morocco', 2, '🇲🇦', 'CAF'),
  ('Senegal', 2, '🇸🇳', 'CAF'),
  ('Japan', 2, '🇯🇵', 'AFC'),
  ('Australia', 2, '🇦🇺', 'AFC'),
  ('Poland', 2, '🇵🇱', 'UEFA'),
  ('Ecuador', 2, '🇪🇨', 'CONMEBOL'),
  ('South Korea', 2, '🇰🇷', 'AFC'),
  ('Serbia', 2, '🇷🇸', 'UEFA'),
  ('Canada', 3, '🇨🇦', 'CONCACAF'),
  ('Turkey', 3, '🇹🇷', 'UEFA'),
  ('Costa Rica', 3, '🇨🇷', 'CONCACAF'),
  ('Tunisia', 3, '🇹🇳', 'CAF'),
  ('Cameroon', 3, '🇨🇲', 'CAF'),
  ('Saudi Arabia', 3, '🇸🇦', 'AFC'),
  ('Ukraine', 3, '🇺🇦', 'UEFA'),
  ('Scotland', 3, '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA'),
  ('Austria', 3, '🇦🇹', 'UEFA'),
  ('Ghana', 3, '🇬🇭', 'CAF'),
  ('Panama', 3, '🇵🇦', 'CONCACAF'),
  ('Venezuela', 3, '🇻🇪', 'CONMEBOL'),
  ('Iran', 4, '🇮🇷', 'AFC'),
  ('Indonesia', 4, '🇮🇩', 'AFC'),
  ('Jamaica', 4, '🇯🇲', 'CONCACAF'),
  ('New Zealand', 4, '🇳🇿', 'OFC'),
  ('Albania', 4, '🇦🇱', 'UEFA'),
  ('Slovenia', 4, '🇸🇮', 'UEFA'),
  ('Bolivia', 4, '🇧🇴', 'CONMEBOL'),
  ('Honduras', 4, '🇭🇳', 'CONCACAF'),
  ('DR Congo', 4, '🇨🇩', 'CAF'),
  ('Guinea', 4, '🇬🇳', 'CAF'),
  ('Iraq', 4, '🇮🇶', 'AFC'),
  ('Paraguay', 4, '🇵🇾', 'CONMEBOL')
on conflict (name) do nothing;

-- Quiz results and draft positions are set at runtime (not seeded)
-- Run The Gauntlet quiz from /quiz to determine draft order
-- Admin (Jakob) locks positions from /quiz after all 4 players complete

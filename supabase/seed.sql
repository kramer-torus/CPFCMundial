-- Default PINs: Kev=1234, Franks=2222, Kangars=3333, Jakob=2026 (admin), Matty Eagles=5555, Bananaman=7777
insert into users (display_name, pin_hash, is_admin, accent_colour) values
  ('Kev',          '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', false, '#C4122E'),
  ('Franks',       'edee29f882543b956620b26d0ee0e7e950399b1c4222f5de05e06425b4c995e9', false, '#3B82F6'),
  ('Kangars',      '318aee3fed8c9d040d35a7fc1fa776fb31303833aa2de885354ddf3d44d8fb69', false, '#C9A84C'),
  ('Jakob',        '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab', true,  '#10B981'),
  ('Matty Eagles', 'c1f330d0aff31c1c87403f1e4347bcc21aff7c179908723535f2b31723702525', false, '#F97316'),
  ('Bananaman',    '41c991eb6a66242c0454191244278183ce58cf4a6bcd372f799e4b9cc01886af', false, '#A855F7')
on conflict (display_name) do nothing;

insert into teams (name, tier, flag_emoji, confederation, fifa_group, fifa_ranking, is_debut) values
  ('France',1,'🇫🇷','UEFA','I',1,false),('Spain',1,'🇪🇸','UEFA','H',2,false),
  ('Argentina',1,'🇦🇷','CONMEBOL','J',3,false),('England',1,'🏴󠁧󠁢󠁥󠁮󠁧󠁿','UEFA','L',4,false),
  ('Portugal',1,'🇵🇹','UEFA','K',5,false),('Brazil',1,'🇧🇷','CONMEBOL','C',6,false),
  ('Netherlands',1,'🇳🇱','UEFA','F',7,false),('Morocco',1,'🇲🇦','CAF','C',8,false),
  ('Belgium',1,'🇧🇪','UEFA','G',9,false),('Germany',1,'🇩🇪','UEFA','E',10,false),
  ('Croatia',1,'🇭🇷','UEFA','L',11,false),('Colombia',1,'🇨🇴','CONMEBOL','K',12,false),
  ('Senegal',2,'🇸🇳','CAF','I',13,false),('Mexico',2,'🇲🇽','CONCACAF','A',14,false),
  ('United States',2,'🇺🇸','CONCACAF','D',15,false),('Uruguay',2,'🇺🇾','CONMEBOL','H',16,false),
  ('Japan',2,'🇯🇵','AFC','F',17,false),('Switzerland',2,'🇨🇭','UEFA','B',18,false),
  ('Iran',2,'🇮🇷','AFC','G',19,false),('Austria',2,'🇦🇹','UEFA','J',20,false),
  ('Ecuador',2,'🇪🇨','CONMEBOL','E',21,false),('South Korea',2,'🇰🇷','AFC','A',22,false),
  ('Australia',2,'🇦🇺','AFC','D',23,false),('Egypt',2,'🇪🇬','CAF','G',24,false),
  ('Canada',3,'🇨🇦','CONCACAF','B',25,false),('Ivory Coast',3,'🇨🇮','CAF','E',26,false),
  ('Qatar',3,'🇶🇦','AFC','B',27,false),('Algeria',3,'🇩🇿','CAF','J',28,false),
  ('Sweden',3,'🇸🇪','UEFA','F',29,false),('Tunisia',3,'🇹🇳','CAF','F',30,false),
  ('Czechia',3,'🇨🇿','UEFA','A',31,false),('Turkey',3,'🇹🇷','UEFA','D',32,false),
  ('Norway',3,'🇳🇴','UEFA','I',33,false),('Scotland',3,'🏴󠁧󠁢󠁳󠁣󠁴󠁿','UEFA','C',34,false),
  ('DR Congo',3,'🇨🇩','CAF','K',35,false),('Bosnia & Herzegovina',3,'🇧🇦','UEFA','B',36,false),
  ('Panama',4,'🇵🇦','CONCACAF','L',48,false),('Saudi Arabia',4,'🇸🇦','AFC','H',50,false),
  ('South Africa',4,'🇿🇦','CAF','A',55,false),('Iraq',4,'🇮🇶','AFC','I',60,false),
  ('Uzbekistan',4,'🇺🇿','AFC','K',65,true),('Paraguay',4,'🇵🇾','CONMEBOL','D',70,false),
  ('Ghana',4,'🇬🇭','CAF','L',75,false),('Jordan',4,'🇯🇴','AFC','J',80,true),
  ('Cape Verde',4,'🇨🇻','CAF','H',85,true),('Curacao',4,'🇨🇼','CONCACAF','E',90,true),
  ('Haiti',4,'🇭🇹','CONCACAF','C',95,false),('New Zealand',4,'🇳🇿','OFC','G',100,false)
on conflict (name) do update set tier=excluded.tier, fifa_group=excluded.fifa_group, fifa_ranking=excluded.fifa_ranking, is_debut=excluded.is_debut;

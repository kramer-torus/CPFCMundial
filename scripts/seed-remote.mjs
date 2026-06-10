const [urlArg, keyArg] = process.argv.slice(2);
const URL_IN = urlArg || process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = keyArg || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!URL_IN || !KEY) {
  console.error('Usage: node scripts/seed-remote.mjs <supabase-url> <anon-key>');
  console.error('   or set NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}
const BASE = URL_IN.replace(/\/$/, '') + '/rest/v1';
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' };

async function probe(table) {
  const r = await fetch(`${BASE}/${table}?limit=1`, { headers: H });
  const body = await r.text();
  console.log(`PROBE ${table}: ${r.status} ${body.slice(0, 300)}`);
  return r.ok;
}

async function del(table) {
  const r = await fetch(`${BASE}/${table}?id=not.is.null`, { method: 'DELETE', headers: H });
  console.log(`DELETE ${table}: ${r.status}${r.ok ? '' : ' ' + (await r.text()).slice(0, 200)}`);
}

async function insert(table, rows) {
  const r = await fetch(`${BASE}/${table}`, {
    method: 'POST',
    headers: { ...H, Prefer: 'return=minimal' },
    body: JSON.stringify(rows),
  });
  console.log(`INSERT ${table} (${rows.length} rows): ${r.status}${r.ok ? ' OK' : ' ' + (await r.text()).slice(0, 300)}`);
  return r.ok;
}

async function count(table) {
  const r = await fetch(`${BASE}/${table}?select=*`, { headers: { ...H, Prefer: 'count=exact', Range: '0-0' } });
  console.log(`COUNT ${table}: ${r.headers.get('content-range')}`);
}

const USERS = [
  { display_name: 'Kev',          pin_hash: '03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4', is_admin: false, accent_colour: '#C4122E' },
  { display_name: 'Franks',       pin_hash: 'edee29f882543b956620b26d0ee0e7e950399b1c4222f5de05e06425b4c995e9', is_admin: false, accent_colour: '#3B82F6' },
  { display_name: 'Kangars',      pin_hash: '318aee3fed8c9d040d35a7fc1fa776fb31303833aa2de885354ddf3d44d8fb69', is_admin: false, accent_colour: '#C9A84C' },
  { display_name: 'Jakob',        pin_hash: '158a323a7ba44870f23d96f1516dd70aa48e9a72db4ebb026b0a89e212a208ab', is_admin: true,  accent_colour: '#10B981' },
  { display_name: 'Matty Eagles', pin_hash: 'c1f330d0aff31c1c87403f1e4347bcc21aff7c179908723535f2b31723702525', is_admin: false, accent_colour: '#F97316' },
  { display_name: 'Bananaman',    pin_hash: 'd7697570462f7562b83e81258de0f1e41832e98072e44c36ec8efec46786e24e', is_admin: false, accent_colour: '#EAB308' },
  { display_name: 'Liam',         pin_hash: '41c991eb6a66242c0454191244278183ce58cf4a6bcd372f799e4b9cc01886af', is_admin: false, accent_colour: '#A855F7' },
  { display_name: 'Manuel',       pin_hash: '2926a2731f4b312c08982cacf8061eb14bf65c1a87cc5d70e864e079c6220731', is_admin: false, accent_colour: '#EC4899' },
];

const T = (name, tier, flag_emoji, confederation, fifa_group, fifa_ranking, is_debut = false) =>
  ({ name, tier, flag_emoji, confederation, fifa_group, fifa_ranking, is_debut });

const TEAMS = [
  // TIER 1 — Elite (FIFA #1–16)
  T('France', 1, '🇫🇷', 'UEFA', 'I', 1),
  T('Spain', 1, '🇪🇸', 'UEFA', 'H', 2),
  T('Argentina', 1, '🇦🇷', 'CONMEBOL', 'J', 3),
  T('England', 1, '🏴󠁧󠁢󠁥󠁮󠁧󠁿', 'UEFA', 'L', 4),
  T('Portugal', 1, '🇵🇹', 'UEFA', 'K', 5),
  T('Brazil', 1, '🇧🇷', 'CONMEBOL', 'C', 6),
  T('Netherlands', 1, '🇳🇱', 'UEFA', 'F', 7),
  T('Morocco', 1, '🇲🇦', 'CAF', 'C', 8),
  T('Belgium', 1, '🇧🇪', 'UEFA', 'G', 9),
  T('Germany', 1, '🇩🇪', 'UEFA', 'E', 10),
  T('Croatia', 1, '🇭🇷', 'UEFA', 'L', 11),
  T('Colombia', 1, '🇨🇴', 'CONMEBOL', 'K', 12),
  T('Senegal', 1, '🇸🇳', 'CAF', 'I', 13),
  T('Mexico', 1, '🇲🇽', 'CONCACAF', 'A', 14),
  T('United States', 1, '🇺🇸', 'CONCACAF', 'D', 15),
  T('Uruguay', 1, '🇺🇾', 'CONMEBOL', 'H', 16),
  // TIER 2 — Contenders (FIFA #17–32)
  T('Japan', 2, '🇯🇵', 'AFC', 'F', 17),
  T('Switzerland', 2, '🇨🇭', 'UEFA', 'B', 18),
  T('Iran', 2, '🇮🇷', 'AFC', 'G', 19),
  T('Austria', 2, '🇦🇹', 'UEFA', 'J', 20),
  T('Ecuador', 2, '🇪🇨', 'CONMEBOL', 'E', 21),
  T('South Korea', 2, '🇰🇷', 'AFC', 'A', 22),
  T('Australia', 2, '🇦🇺', 'AFC', 'D', 23),
  T('Egypt', 2, '🇪🇬', 'CAF', 'G', 24),
  T('Canada', 2, '🇨🇦', 'CONCACAF', 'B', 25),
  T('Ivory Coast', 2, '🇨🇮', 'CAF', 'E', 26),
  T('Qatar', 2, '🇶🇦', 'AFC', 'B', 27),
  T('Algeria', 2, '🇩🇿', 'CAF', 'J', 28),
  T('Sweden', 2, '🇸🇪', 'UEFA', 'F', 29),
  T('Tunisia', 2, '🇹🇳', 'CAF', 'F', 30),
  T('Czechia', 2, '🇨🇿', 'UEFA', 'A', 31),
  T('Turkey', 2, '🇹🇷', 'UEFA', 'D', 32),
  // TIER 3 — Dark Horses (FIFA #33–48)
  T('Norway', 3, '🇳🇴', 'UEFA', 'I', 33),
  T('Scotland', 3, '🏴󠁧󠁢󠁳󠁣󠁴󠁿', 'UEFA', 'C', 34),
  T('DR Congo', 3, '🇨🇩', 'CAF', 'K', 35),
  T('Bosnia & Herzegovina', 3, '🇧🇦', 'UEFA', 'B', 36),
  T('Panama', 3, '🇵🇦', 'CONCACAF', 'L', 48),
  T('Saudi Arabia', 3, '🇸🇦', 'AFC', 'H', 50),
  T('South Africa', 3, '🇿🇦', 'CAF', 'A', 55),
  T('Iraq', 3, '🇮🇶', 'AFC', 'I', 60),
  T('Uzbekistan', 3, '🇺🇿', 'AFC', 'K', 65, true),
  T('Paraguay', 3, '🇵🇾', 'CONMEBOL', 'D', 70),
  T('Ghana', 3, '🇬🇭', 'CAF', 'L', 75),
  T('Jordan', 3, '🇯🇴', 'AFC', 'J', 80, true),
  T('Cape Verde', 3, '🇨🇻', 'CAF', 'H', 85, true),
  T('Curacao', 3, '🇨🇼', 'CONCACAF', 'E', 90, true),
  T('Haiti', 3, '🇭🇹', 'CONCACAF', 'C', 95),
  T('New Zealand', 3, '🇳🇿', 'OFC', 'G', 100),
];

console.log('=== 1. Probing current state ===');
const ok = await probe('users');
if (!ok) {
  console.log('Cannot reach users table — aborting before any changes.');
  process.exit(1);
}
await probe('teams');

console.log('\n=== 2. Clearing old data ===');
for (const t of ['quiz_results', 'draft_picks', 'team_points', 'audit_log', 'users', 'teams']) {
  await del(t);
}

console.log('\n=== 3. Inserting 8 players + 48 teams ===');
await insert('users', USERS);
await insert('teams', TEAMS);

console.log('\n=== 4. Verifying ===');
await count('users');
await count('teams');

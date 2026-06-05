# CPFCMundial

A Crystal Palace FC 2026 World Cup draft game. Four players (Kev, Franks, Kangars, Jakob) each draft 12 international teams across 4 tiers via snake draft, then track points throughout the tournament.

## Local Dev Setup

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase credentials in .env.local
npm run dev
```

Open http://localhost:3000

## Supabase Setup

1. Create a new project at https://supabase.com
2. Copy `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Project Settings → API
3. In the SQL Editor, run `supabase/schema.sql`
4. Then run `supabase/seed.sql` to insert users and all 48 teams

## Default PINs

| Player  | PIN  | Admin |
|---------|------|-------|
| Kev     | 1234 | No    |
| Franks  | 2222 | No    |
| Kangars | 3333 | No    |
| Jakob   | 2026 | Yes   |

## Changing a PIN

Run this in the Supabase SQL Editor:

```sql
UPDATE users SET pin_hash = encode(sha256('NEWPIN'::bytea), 'hex') WHERE display_name = 'Name';
```

## Fixtures API

Fixtures use football-data.org. The free tier does not include World Cup data. For live WC fixtures, use [API-Football](https://www.api-football.com/) (free tier: 100 req/day) and update `lib/fixtures.ts` to call that API instead.

Set `NEXT_PUBLIC_FOOTBALL_DATA_API_KEY` in your environment to enable the fixtures page (it will gracefully show a "coming soon" message if the key is missing or the competition is unavailable).

## Vercel Deploy

1. Push to GitHub
2. Connect repo in Vercel
3. Add environment variables: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `NEXT_PUBLIC_FOOTBALL_DATA_API_KEY`
4. Deploy — Vercel auto-deploys on push to main

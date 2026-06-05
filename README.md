# CPFCMundial

A Crystal Palace FC 2026 World Cup draft game. Four players (Kev, Franks, Kangars, Jakob) each draft 12 international teams across 4 tiers via snake draft, then track points throughout the tournament.

## What It Is

CPFCMundial is a private draft game for the 2026 FIFA World Cup. Players pick national teams across 4 tiers (Elite, Contenders, Dark Horses, Underdogs) and earn points based on match results. The player whose 12 teams accumulate the most points wins.

Built with Next.js 14, Supabase (Postgres + Realtime), and Tailwind CSS. Deployed as a PWA on Vercel.

## Local Dev Setup

```bash
npm install
```

Create `.env.local` with your credentials:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_FOOTBALL_DATA_API_KEY=your_football_data_key  # optional
```

```bash
npm run dev
```

Open http://localhost:3000

## Supabase Setup

1. Create a new project at https://supabase.com
2. Go to **Project Settings → API** and copy your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Open the **SQL Editor** and run `supabase/schema.sql`
4. Then run `supabase/seed.sql` to insert the 4 users and all 48 qualified teams

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

Fixtures use [football-data.org](https://www.football-data.org/). The free tier does **not** include World Cup data.

For live WC fixtures, use [API-Football](https://www.api-football.com/) (free tier: 100 req/day) and update `lib/fixtures.ts` to call that API instead.

Set `NEXT_PUBLIC_FOOTBALL_DATA_API_KEY` in your environment. The fixtures page gracefully shows a "coming soon" message if the key is missing or the competition is unavailable.

## Vercel Deploy

1. Push to GitHub
2. Connect repo in Vercel
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_FOOTBALL_DATA_API_KEY` (optional)
4. Deploy — Vercel auto-deploys on every push to main

## PWA: Install on iPhone

1. Open the app in Safari
2. Tap **Share** → **Add to Home Screen**
3. Tap **Add**

The app works offline for all static pages once installed.

## The Gauntlet (Draft Order Quiz)

Before the draft, each player completes the quiz at `/quiz` solo. Their score determines draft order — highest score picks first. The admin locks the order once all 4 have completed it.

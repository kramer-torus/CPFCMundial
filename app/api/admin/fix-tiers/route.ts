import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const TEAMS: { name: string; tier: number; fifa_ranking: number; flag_emoji: string; confederation: string; fifa_group: string; is_debut: boolean }[] = [
  { name: 'France', tier: 1, fifa_ranking: 1, flag_emoji: '🇫🇷', confederation: 'UEFA', fifa_group: 'I', is_debut: false },
  { name: 'Spain', tier: 1, fifa_ranking: 2, flag_emoji: '🇪🇸', confederation: 'UEFA', fifa_group: 'H', is_debut: false },
  { name: 'Argentina', tier: 1, fifa_ranking: 3, flag_emoji: '🇦🇷', confederation: 'CONMEBOL', fifa_group: 'J', is_debut: false },
  { name: 'England', tier: 1, fifa_ranking: 4, flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA', fifa_group: 'L', is_debut: false },
  { name: 'Portugal', tier: 1, fifa_ranking: 5, flag_emoji: '🇵🇹', confederation: 'UEFA', fifa_group: 'K', is_debut: false },
  { name: 'Brazil', tier: 1, fifa_ranking: 6, flag_emoji: '🇧🇷', confederation: 'CONMEBOL', fifa_group: 'C', is_debut: false },
  { name: 'Netherlands', tier: 1, fifa_ranking: 7, flag_emoji: '🇳🇱', confederation: 'UEFA', fifa_group: 'F', is_debut: false },
  { name: 'Morocco', tier: 1, fifa_ranking: 8, flag_emoji: '🇲🇦', confederation: 'CAF', fifa_group: 'C', is_debut: false },
  { name: 'Belgium', tier: 1, fifa_ranking: 9, flag_emoji: '🇧🇪', confederation: 'UEFA', fifa_group: 'G', is_debut: false },
  { name: 'Germany', tier: 1, fifa_ranking: 10, flag_emoji: '🇩🇪', confederation: 'UEFA', fifa_group: 'E', is_debut: false },
  { name: 'Croatia', tier: 1, fifa_ranking: 11, flag_emoji: '🇭🇷', confederation: 'UEFA', fifa_group: 'L', is_debut: false },
  { name: 'Colombia', tier: 1, fifa_ranking: 12, flag_emoji: '🇨🇴', confederation: 'CONMEBOL', fifa_group: 'K', is_debut: false },
  { name: 'Senegal', tier: 2, fifa_ranking: 13, flag_emoji: '🇸🇳', confederation: 'CAF', fifa_group: 'I', is_debut: false },
  { name: 'Mexico', tier: 2, fifa_ranking: 14, flag_emoji: '🇲🇽', confederation: 'CONCACAF', fifa_group: 'A', is_debut: false },
  { name: 'United States', tier: 2, fifa_ranking: 15, flag_emoji: '🇺🇸', confederation: 'CONCACAF', fifa_group: 'D', is_debut: false },
  { name: 'Uruguay', tier: 2, fifa_ranking: 16, flag_emoji: '🇺🇾', confederation: 'CONMEBOL', fifa_group: 'H', is_debut: false },
  { name: 'Japan', tier: 2, fifa_ranking: 17, flag_emoji: '🇯🇵', confederation: 'AFC', fifa_group: 'F', is_debut: false },
  { name: 'Switzerland', tier: 2, fifa_ranking: 18, flag_emoji: '🇨🇭', confederation: 'UEFA', fifa_group: 'B', is_debut: false },
  { name: 'Iran', tier: 2, fifa_ranking: 19, flag_emoji: '🇮🇷', confederation: 'AFC', fifa_group: 'G', is_debut: false },
  { name: 'Austria', tier: 2, fifa_ranking: 20, flag_emoji: '🇦🇹', confederation: 'UEFA', fifa_group: 'J', is_debut: false },
  { name: 'Ecuador', tier: 2, fifa_ranking: 21, flag_emoji: '🇪🇨', confederation: 'CONMEBOL', fifa_group: 'E', is_debut: false },
  { name: 'South Korea', tier: 2, fifa_ranking: 22, flag_emoji: '🇰🇷', confederation: 'AFC', fifa_group: 'A', is_debut: false },
  { name: 'Australia', tier: 2, fifa_ranking: 23, flag_emoji: '🇦🇺', confederation: 'AFC', fifa_group: 'D', is_debut: false },
  { name: 'Egypt', tier: 2, fifa_ranking: 24, flag_emoji: '🇪🇬', confederation: 'CAF', fifa_group: 'G', is_debut: false },
  { name: 'Canada', tier: 3, fifa_ranking: 25, flag_emoji: '🇨🇦', confederation: 'CONCACAF', fifa_group: 'B', is_debut: false },
  { name: 'Ivory Coast', tier: 3, fifa_ranking: 26, flag_emoji: '🇨🇮', confederation: 'CAF', fifa_group: 'E', is_debut: false },
  { name: 'Qatar', tier: 3, fifa_ranking: 27, flag_emoji: '🇶🇦', confederation: 'AFC', fifa_group: 'B', is_debut: false },
  { name: 'Algeria', tier: 3, fifa_ranking: 28, flag_emoji: '🇩🇿', confederation: 'CAF', fifa_group: 'J', is_debut: false },
  { name: 'Sweden', tier: 3, fifa_ranking: 29, flag_emoji: '🇸🇪', confederation: 'UEFA', fifa_group: 'F', is_debut: false },
  { name: 'Tunisia', tier: 3, fifa_ranking: 30, flag_emoji: '🇹🇳', confederation: 'CAF', fifa_group: 'F', is_debut: false },
  { name: 'Czechia', tier: 3, fifa_ranking: 31, flag_emoji: '🇨🇿', confederation: 'UEFA', fifa_group: 'A', is_debut: false },
  { name: 'Turkey', tier: 3, fifa_ranking: 32, flag_emoji: '🇹🇷', confederation: 'UEFA', fifa_group: 'D', is_debut: false },
  { name: 'Norway', tier: 3, fifa_ranking: 33, flag_emoji: '🇳🇴', confederation: 'UEFA', fifa_group: 'I', is_debut: false },
  { name: 'Scotland', tier: 3, fifa_ranking: 34, flag_emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA', fifa_group: 'C', is_debut: false },
  { name: 'DR Congo', tier: 3, fifa_ranking: 35, flag_emoji: '🇨🇩', confederation: 'CAF', fifa_group: 'K', is_debut: false },
  { name: 'Bosnia & Herzegovina', tier: 3, fifa_ranking: 36, flag_emoji: '🇧🇦', confederation: 'UEFA', fifa_group: 'B', is_debut: false },
  { name: 'Panama', tier: 4, fifa_ranking: 48, flag_emoji: '🇵🇦', confederation: 'CONCACAF', fifa_group: 'L', is_debut: false },
  { name: 'Saudi Arabia', tier: 4, fifa_ranking: 50, flag_emoji: '🇸🇦', confederation: 'AFC', fifa_group: 'H', is_debut: false },
  { name: 'South Africa', tier: 4, fifa_ranking: 55, flag_emoji: '🇿🇦', confederation: 'CAF', fifa_group: 'A', is_debut: false },
  { name: 'Iraq', tier: 4, fifa_ranking: 60, flag_emoji: '🇮🇶', confederation: 'AFC', fifa_group: 'I', is_debut: false },
  { name: 'Uzbekistan', tier: 4, fifa_ranking: 65, flag_emoji: '🇺🇿', confederation: 'AFC', fifa_group: 'K', is_debut: true },
  { name: 'Paraguay', tier: 4, fifa_ranking: 70, flag_emoji: '🇵🇾', confederation: 'CONMEBOL', fifa_group: 'D', is_debut: false },
  { name: 'Ghana', tier: 4, fifa_ranking: 75, flag_emoji: '🇬🇭', confederation: 'CAF', fifa_group: 'L', is_debut: false },
  { name: 'Jordan', tier: 4, fifa_ranking: 80, flag_emoji: '🇯🇴', confederation: 'AFC', fifa_group: 'J', is_debut: true },
  { name: 'Cape Verde', tier: 4, fifa_ranking: 85, flag_emoji: '🇨🇻', confederation: 'CAF', fifa_group: 'H', is_debut: true },
  { name: 'Curacao', tier: 4, fifa_ranking: 90, flag_emoji: '🇨🇼', confederation: 'CONCACAF', fifa_group: 'E', is_debut: true },
  { name: 'Haiti', tier: 4, fifa_ranking: 95, flag_emoji: '🇭🇹', confederation: 'CONCACAF', fifa_group: 'C', is_debut: false },
  { name: 'New Zealand', tier: 4, fifa_ranking: 100, flag_emoji: '🇳🇿', confederation: 'OFC', fifa_group: 'G', is_debut: false },
];

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body || String(body.pin) !== String(process.env.NEXT_PUBLIC_ADMIN_PIN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { error } = await supabase.from('teams').upsert(TEAMS, { onConflict: 'name' });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: tiers } = await supabase
    .from('teams')
    .select('tier')
    .order('tier');

  const counts: Record<number, number> = {};
  for (const t of tiers ?? []) counts[t.tier] = (counts[t.tier] ?? 0) + 1;

  return NextResponse.json({ ok: true, tiers: counts });
}

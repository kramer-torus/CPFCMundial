import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateOddsSnapshot, ODDS_SNAPSHOT_ACTION } from '@/lib/odds';
import { knockoutQualifiers } from '@/lib/elimination';
import type { GameUser, DraftPick, Team, TeamPoints } from '@/lib/types';

const FD_BASE = 'https://api.football-data.org/v4';
const WC_CODE = 'WC';

const TEAM_NAME_MAP: Record<string, string> = {
  'IR Iran': 'Iran',
  'Korea Republic': 'South Korea',
  'USA': 'United States',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Czech Republic': 'Czechia',
  'Cape Verde Islands': 'Cape Verde',
  'Curaçao': 'Curacao',
  'Congo DR': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'Republic of Congo': 'DR Congo',
};

function resolveRound(stage: string, matchday: number | null): string | null {
  if (stage === 'GROUP_STAGE') {
    if (matchday === 1) return 'GW1';
    if (matchday === 2) return 'GW2';
    if (matchday === 3) return 'GW3';
    return null;
  }
  const map: Record<string, string> = {
    LAST_32: 'R32', LAST_16: 'R16', QUARTER_FINALS: 'QF',
    SEMI_FINALS: 'SF', THIRD_PLACE: '3PO', PLAY_OFF_3RD_PLACE: '3PO', FINAL: 'FINAL',
  };
  return map[stage] ?? null;
}

function calcPoints(round: string, won: boolean, drew: boolean): number {
  if (round === 'FINAL') return won ? 5 : 3;
  if (round === '3PO') return won ? 2 : 0;
  if (['GW1', 'GW2', 'GW3'].includes(round)) return drew ? 1 : won ? 3 : 0;
  return won ? 3 : 0;
}

function normaliseName(name: string): string {
  return TEAM_NAME_MAP[name] ?? name;
}

export async function GET(req: NextRequest) {
  try {
    return await sync(req);
  } catch (err) {
    // Never leak an unhandled exception as a bare 500 — surface it so the
    // failure is diagnosable and the caller can decide whether to alert.
    return NextResponse.json(
      { ok: false, error: 'sync_exception', detail: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    );
  }
}

async function sync(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get('authorization') ?? req.nextUrl.searchParams.get('secret') ?? '';
    const provided = auth.startsWith('Bearer ') ? auth.slice(7) : auth;
    if (provided !== secret) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'FOOTBALL_DATA_API_KEY not configured' }, { status: 503 });

  let fdRes: Response;
  try {
    fdRes = await fetch(`${FD_BASE}/competitions/${WC_CODE}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      cache: 'no-store',
    });
  } catch (err) {
    // Network/DNS/timeout reaching the feed — transient, not our bug.
    return NextResponse.json({ ok: false, error: 'upstream_unreachable', detail: String(err) }, { status: 502 });
  }
  if (!fdRes.ok) {
    const text = await fdRes.text().catch(() => '');
    return NextResponse.json({ ok: false, error: `football-data.org ${fdRes.status}`, detail: text }, { status: 502 });
  }

  // The feed occasionally answers 200 with a non-match payload (rate-limit
  // notices, restricted-competition messages). Treat a missing/!array `matches`
  // as a transient upstream condition rather than crashing on `.filter`.
  const payload = await fdRes.json().catch(() => null) as { matches?: FDMatch[] } | null;
  if (!payload || !Array.isArray(payload.matches)) {
    return NextResponse.json(
      { ok: false, error: 'upstream_no_matches', detail: JSON.stringify(payload)?.slice(0, 300) ?? 'null' },
      { status: 502 },
    );
  }
  const matches = payload.matches;
  const finished = matches.filter(m => m.status === 'FINISHED');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ ok: false, error: 'supabase_env_missing' }, { status: 503 });
  }
  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data: teamsData } = await supabase.from('teams').select('id, name, tier, flag_emoji, fifa_ranking, confederation, is_debut');
  const teams: Team[] = (teamsData ?? []) as Team[];
  const teamLookup: { id: string; name: string }[] = teams;

  function findId(apiName: string): string | null {
    const normalised = normaliseName(apiName);
    return teamLookup.find(t => t.name.toLowerCase() === normalised.toLowerCase())?.id ?? null;
  }

  const rows: UpsertRow[] = [];
  const now = new Date().toISOString();
  const unknownTeams: string[] = [];

  for (const match of finished) {
    const round = resolveRound(match.stage, match.matchday ?? null);
    if (!round) continue;
    const homeName = match.homeTeam?.name;
    const awayName = match.awayTeam?.name;
    if (!homeName || !awayName) continue; // undetermined fixture — skip
    const homeId = findId(homeName);
    const awayId = findId(awayName);
    if (!homeId) unknownTeams.push(homeName);
    if (!awayId) unknownTeams.push(awayName);
    const isGroup = ['GW1', 'GW2', 'GW3'].includes(round);
    let homeWon: boolean, awayWon: boolean, drew = false;
    if (isGroup) {
      const h = match.score.fullTime.home ?? 0;
      const a = match.score.fullTime.away ?? 0;
      drew = h === a; homeWon = h > a; awayWon = a > h;
    } else {
      homeWon = match.score.winner === 'HOME_TEAM';
      awayWon = match.score.winner === 'AWAY_TEAM';
    }
    if (homeId) rows.push({ team_id: homeId, round, points: calcPoints(round, homeWon, drew), updated_at: now });
    if (awayId) rows.push({ team_id: awayId, round, points: calcPoints(round, awayWon, drew && isGroup), updated_at: now });
  }

  if (rows.length > 0) {
    const { error } = await supabase.from('team_points').upsert(rows, { onConflict: 'team_id,round' });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Regenerate odds snapshot now that scores changed
    const [usersRes, picksRes, freshPointsRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('draft_picks').select('*'),
      supabase.from('team_points').select('*'),
    ]);
    const snapUsers = (usersRes.data ?? []) as GameUser[];
    const snapPicks = (picksRes.data ?? []) as DraftPick[];
    const snapPoints = (freshPointsRes.data ?? []) as TeamPoints[];
    if (snapUsers.length && snapPicks.length) {
      // Derive the R32 field from the live feed so eliminated teams stop
      // contributing strength to their owner's odds.
      const qualifiers = knockoutQualifiers(
        matches.map(m => ({ stage: m.stage, homeTeam: m.homeTeam?.name ?? '', awayTeam: m.awayTeam?.name ?? '' })),
        teams,
      );
      const snapshot = generateOddsSnapshot(snapUsers, snapPicks, teams, snapPoints, qualifiers);
      const adminUser = snapUsers.find(u => u.is_admin) ?? snapUsers[0];
      await supabase.from('audit_log').insert({
        user_id: adminUser.id,
        action: ODDS_SNAPSHOT_ACTION,
        detail: JSON.stringify(snapshot),
        created_at: now,
      });
    }
  }

  const deduped = unknownTeams.filter((n, i) => unknownTeams.indexOf(n) === i);
  return NextResponse.json({
    ok: true, matchesProcessed: finished.length, rowsUpserted: rows.length, syncedAt: now,
    ...(deduped.length > 0 && { unmappedTeams: deduped }),
  });
}

interface FDMatch {
  status: string; stage: string; matchday?: number;
  // Undetermined knockout fixtures come back with null team/name.
  homeTeam: { name: string | null } | null; awayTeam: { name: string | null } | null;
  score: { winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null; fullTime: { home: number | null; away: number | null } };
}
interface UpsertRow { team_id: string; round: string; points: number; updated_at: string; }

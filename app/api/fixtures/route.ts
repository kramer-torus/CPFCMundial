import { NextResponse } from 'next/server';

const FD_BASE = 'https://api.football-data.org/v4';
const WC_CODE = 'WC';

const STAGE_LABEL_MAP: Record<string, string> = {
  GROUP_STAGE: 'Group Stage',
  LAST_32: 'Round of 32',
  LAST_16: 'Round of 16',
  QUARTER_FINALS: 'Quarter-final',
  SEMI_FINALS: 'Semi-final',
  THIRD_PLACE: '3rd Place Play-off',
  PLAY_OFF_3RD_PLACE: '3rd Place Play-off',
  FINAL: 'Final',
};

export interface FixtureMatch {
  id: number;
  status: string;
  stage: string;
  stageLabel: string;
  group: string | null;
  matchday: number | null;
  utcDate: string;
  venue: string | null;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  winner: 'HOME_TEAM' | 'AWAY_TEAM' | 'DRAW' | null;
}

export async function GET() {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ matches: [], error: 'NO_KEY' }, { status: 503 });
  }

  let res: Response;
  try {
    res = await fetch(`${FD_BASE}/competitions/${WC_CODE}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 60 },
    });
  } catch (err) {
    return NextResponse.json(
      { matches: [], error: 'FETCH_ERROR', detail: String(err) },
      { status: 502 }
    );
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    return NextResponse.json(
      { matches: [], error: `FD_${res.status}`, detail: text },
      { status: 502 }
    );
  }

  const data = await res.json();

  const matches: FixtureMatch[] = (data.matches ?? []).map((m: any) => {
    const rawGroup: string | null = m.group ?? null;
    // Strip "GROUP_" prefix → "A", "B", etc.
    const group = rawGroup ? rawGroup.replace(/^GROUP_/, '') : null;

    return {
      id: m.id,
      status: m.status,
      stage: m.stage,
      stageLabel: STAGE_LABEL_MAP[m.stage] ?? m.stage,
      group,
      matchday: m.matchday ?? null,
      utcDate: m.utcDate,
      venue: m.venue?.name ?? null,
      homeTeam: m.homeTeam?.name ?? 'TBD',
      awayTeam: m.awayTeam?.name ?? 'TBD',
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
      winner: m.score?.winner ?? null,
    };
  });

  return NextResponse.json({ matches });
}

import { NextResponse } from 'next/server';

export interface EspnMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number | null;
  awayScore: number | null;
  status: 'pre' | 'in' | 'post';
  clock: string | null;
  utcDate: string;
}

export async function GET() {
  try {
    const res = await fetch(
      'https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard',
      { next: { revalidate: 30 } }
    );
    if (!res.ok) return NextResponse.json({ matches: [], error: `ESPN_${res.status}` }, { status: 502 });
    const data = await res.json();
    const matches: EspnMatch[] = (data.events ?? []).map((e: any) => {
      const comp = e.competitions?.[0];
      const home = comp?.competitors?.find((c: any) => c.homeAway === 'home');
      const away = comp?.competitors?.find((c: any) => c.homeAway === 'away');
      const stype = e.status?.type?.name ?? '';
      const status: 'pre' | 'in' | 'post' =
        stype === 'STATUS_IN_PROGRESS' ? 'in' : stype === 'STATUS_FINAL' ? 'post' : 'pre';
      return {
        id: e.id,
        homeTeam: home?.team?.displayName ?? '',
        awayTeam: away?.team?.displayName ?? '',
        homeScore: status !== 'pre' ? (parseInt(home?.score ?? '0', 10) || 0) : null,
        awayScore: status !== 'pre' ? (parseInt(away?.score ?? '0', 10) || 0) : null,
        status,
        clock: status === 'in' ? (e.status?.displayClock ?? null) : null,
        utcDate: e.date ?? '',
      };
    });
    return NextResponse.json({ matches });
  } catch (err) {
    return NextResponse.json({ matches: [], error: 'ESPN_FETCH_ERROR', detail: String(err) }, { status: 502 });
  }
}

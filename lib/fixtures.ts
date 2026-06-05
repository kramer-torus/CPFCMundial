// Isolated fixture fetch — swap API here without touching pages

export interface Fixture {
  id: number;
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  kickoff: string; // ISO date string
  status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  homeScore: number | null;
  awayScore: number | null;
  stage: string;
  group?: string;
}

const API_BASE = 'https://api.football-data.org/v4';
const WC_CODE = 'WC';

export async function fetchWorldCupFixtures(): Promise<{ fixtures: Fixture[]; error: string | null }> {
  const apiKey = process.env.NEXT_PUBLIC_FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return { fixtures: [], error: 'NO_KEY' };
  }
  try {
    const res = await fetch(`${API_BASE}/competitions/${WC_CODE}/matches`, {
      headers: { 'X-Auth-Token': apiKey },
      next: { revalidate: 60 },
    });
    if (res.status === 403 || res.status === 404) {
      return { fixtures: [], error: 'NOT_AVAILABLE' };
    }
    if (!res.ok) {
      return { fixtures: [], error: 'API_ERROR' };
    }
    const data = await res.json();
    const fixtures: Fixture[] = (data.matches || []).map((m: any) => ({
      id: m.id,
      homeTeam: m.homeTeam?.name || 'TBD',
      awayTeam: m.awayTeam?.name || 'TBD',
      homeFlag: '',
      awayFlag: '',
      kickoff: m.utcDate,
      status: m.status,
      homeScore: m.score?.fullTime?.home ?? null,
      awayScore: m.score?.fullTime?.away ?? null,
      stage: m.stage,
      group: m.group,
    }));
    return { fixtures, error: null };
  } catch {
    return { fixtures: [], error: 'FETCH_ERROR' };
  }
}

export interface Fixture {
  id: number; homeTeam: string; awayTeam: string; homeFlag: string; awayFlag: string;
  kickoff: string; status: 'SCHEDULED' | 'LIVE' | 'FINISHED' | 'POSTPONED';
  homeScore: number | null; awayScore: number | null; stage: string; group?: string;
}

export async function fetchWorldCupFixtures(): Promise<{ fixtures: Fixture[]; error: string | null }> {
  try {
    const res = await fetch('/api/fixtures', { next: { revalidate: 60 } });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      return { fixtures: [], error: data.error ?? 'API_ERROR' };
    }
    const data = await res.json();
    if (data.error) return { fixtures: [], error: data.error };
    const fixtures: Fixture[] = (data.matches ?? []).map((m: any) => ({
      id: m.id, homeTeam: m.homeTeam, awayTeam: m.awayTeam, homeFlag: '', awayFlag: '',
      kickoff: m.utcDate, status: m.status, homeScore: m.homeScore, awayScore: m.awayScore,
      stage: m.stage, group: m.group ?? undefined,
    }));
    return { fixtures, error: null };
  } catch {
    return { fixtures: [], error: 'FETCH_ERROR' };
  }
}

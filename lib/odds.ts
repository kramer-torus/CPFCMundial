// Server-side odds snapshot generator — no external LLM.
// Produces tier + FIFA-ranking weighted decimal odds with narrative blurbs.
// Stored in audit_log (action = ODDS_SNAPSHOT) whenever scores change.
import { GameUser, DraftPick, Team, TeamPoints, KNOCKOUT_ROUNDS } from './types';

export const ODDS_SNAPSHOT_ACTION = 'ODDS_SNAPSHOT';

const TIER_FUTURE_PTS: Record<number, number> = { 1: 14, 2: 9, 3: 5, 4: 3 };

export interface OddsEntry {
  user_id: string;
  display_name: string;
  accent_colour: string;
  points: number;
  teams_alive: number;
  odds: string;
  blurb: string;
}

export interface OddsSnapshot {
  rows: OddsEntry[];
  generated_at: string;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const FAV_LINES = [
  (n: string, o: string) => `*${n} ${o}x* — squad depth is real. Hard to see past this one. 🏆`,
  (n: string, o: string) => `*${n} ${o}x* — T1-heavy and looking ominous. Genuine favourite. 👑`,
  (n: string, o: string) => `*${n} ${o}x* — leads the market. Tournament pedigree in that squad.`,
];
const MID_LINES = [
  (n: string, o: string) => `*${n} ${o}x* — dangerous mid-ranger. One deep run flips this entirely.`,
  (n: string, o: string) => `*${n} ${o}x* — in the mix. Underestimate at your peril. 👀`,
  (n: string, o: string) => `*${n} ${o}x* — compact squad, could peak at exactly the right moment.`,
];
const OUTSIDER_LINES = [
  (n: string, o: string) => `*${n} ${o}x* — value in chaos. The upset merchant of the group.`,
  (n: string, o: string) => `*${n} ${o}x* — praying for wildcards to run deep. Not impossible. 😅`,
  (n: string, o: string) => `*${n} ${o}x* — fighting uphill but tournament football is weird. ⚡`,
];
const BOTTOM_LINES = [
  (n: string, o: string) => `*${n} ${o}x* — needs a miracle. Or three. Every single round. 🙏`,
  (n: string, o: string) => `*${n} ${o}x* — the wooden spoon is beckoning. Nobody's done though.`,
  (n: string, o: string) => `*${n} ${o}x* — clinging on. A couple of upsets and it's a different chat.`,
];

function squadNote(t1: number, t2: number, t3: number, t4: number, topTeam: string | null, topRanking: number): string {
  if (t1 >= 3) return `${t1} elite sides still running. 🔥`;
  if (t1 === 2 && topTeam) return `${topTeam} + one more T1 keeping the engine ticking.`;
  if (t1 === 1 && topTeam) return `${topTeam} carrying the flag solo now.`;
  if (t2 >= 3) return `Contenders-heavy — ${topTeam ?? 'one big run'} could change everything.`;
  if (t4 >= 4) return `Four wildcards still breathing — disorder is the whole strategy.`;
  if (topRanking <= 10 && topTeam) return `Top-10 ${topTeam} leading the charge.`;
  if (t3 >= 3) return `Dark horses can bite — three still alive.`;
  return '';
}

export function generateOddsSnapshot(
  users: GameUser[],
  picks: DraftPick[],
  teams: Team[],
  points: TeamPoints[],
): OddsSnapshot {
  const teamById = new Map(teams.map(t => [t.id, t]));
  const eliminatedIds = new Set(
    points.filter(tp => KNOCKOUT_ROUNDS.includes(tp.round) && tp.points === 0).map(tp => tp.team_id),
  );

  const computed = users.map(u => {
    const myPicks = picks.filter(p => p.user_id === u.id);
    const currentPoints = points
      .filter(tp => myPicks.some(p => p.team_id === tp.team_id))
      .reduce((s, tp) => s + tp.points, 0);
    const alivePicks = myPicks.filter(p => !eliminatedIds.has(p.team_id));
    const expectedFuture = alivePicks.reduce((s, p) => {
      const tier = teamById.get(p.team_id)?.tier ?? 4;
      return s + (TIER_FUTURE_PTS[tier] ?? 3);
    }, 0);

    const tc: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    alivePicks.forEach(p => { const t = teamById.get(p.team_id)?.tier ?? 4; tc[t] = (tc[t] || 0) + 1; });

    const bestAlive = alivePicks
      .map(p => teamById.get(p.team_id))
      .filter(Boolean)
      .sort((a, b) => (a!.fifa_ranking ?? 999) - (b!.fifa_ranking ?? 999))[0];

    return {
      user_id: u.id,
      display_name: u.display_name,
      accent_colour: u.accent_colour,
      points: currentPoints,
      teams_alive: alivePicks.length,
      strength: currentPoints + expectedFuture,
      tc,
      bestTeamName: bestAlive ? `${bestAlive.flag_emoji} ${bestAlive.name}` : null,
      bestTeamRanking: bestAlive?.fifa_ranking ?? 999,
    };
  });

  const total = computed.reduce((s, r) => s + r.strength, 0);
  const sorted = [...computed].sort((a, b) => b.strength - a.strength);
  const n = sorted.length;

  const rows: OddsEntry[] = sorted.map((r, i) => {
    const oddsNum = total === 0 || r.strength === 0 ? 0 : total / r.strength;
    const odds = oddsNum === 0 ? '—' : oddsNum.toFixed(1);
    const note = squadNote(r.tc[1], r.tc[2], r.tc[3], r.tc[4], r.bestTeamName, r.bestTeamRanking);

    let line: string;
    if (i === 0) line = pick(FAV_LINES)(r.display_name, odds);
    else if (i === n - 1) line = pick(BOTTOM_LINES)(r.display_name, odds);
    else if (i < Math.ceil(n / 2)) line = pick(MID_LINES)(r.display_name, odds);
    else line = pick(OUTSIDER_LINES)(r.display_name, odds);

    return {
      user_id: r.user_id,
      display_name: r.display_name,
      accent_colour: r.accent_colour,
      points: r.points,
      teams_alive: r.teams_alive,
      odds,
      blurb: note ? `${line} ${note}` : line,
    };
  });

  return { rows, generated_at: new Date().toISOString() };
}

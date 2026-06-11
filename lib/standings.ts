// Server-safe standings + bulletin-data computation.
// No 'use client' — imported by the bulletin generation API route.
import { GameUser, DraftPick, Team, TeamPoints, Round, STAGE_ORDER, KNOCKOUT_ROUNDS, ROUND_LABELS } from './types';

export interface PlayerStanding {
  user_id: string;
  display_name: string;
  points: number;
  rank: number;
  teams_alive: number;
  best_stage: string;
  // Per-team breakdown for richer banter
  teams: { name: string; flag: string; tier: number; points: number; eliminated: boolean }[];
}

export interface StandingsSnapshotEntry {
  user_id: string;
  display_name: string;
  points: number;
  rank: number;
}

export interface BulletinData {
  standings: PlayerStanding[];
  // Movement since the previous bulletin: positive = points gained in the window
  movers: { display_name: string; gained: number; rank: number; prev_rank: number | null }[];
  // Which rounds have any recorded results, in tournament order
  roundsPlayed: string[];
  // The most advanced round with any result — a proxy for "where the tournament is"
  latestStage: string | null;
  totalPointsScored: number;
  hasResults: boolean;
}

export function computeStandings(
  users: GameUser[],
  picks: DraftPick[],
  teams: Team[],
  points: TeamPoints[],
): PlayerStanding[] {
  const teamById = new Map(teams.map(t => [t.id, t]));
  const eliminatedIds = new Set(
    points
      .filter(tp => KNOCKOUT_ROUNDS.includes(tp.round) && tp.points === 0)
      .map(tp => tp.team_id),
  );

  return users
    .map(u => {
      const myPicks = picks.filter(p => p.user_id === u.id);
      const myTeamIds = myPicks.map(p => p.team_id);
      const total = points
        .filter(tp => myTeamIds.includes(tp.team_id))
        .reduce((sum, tp) => sum + tp.points, 0);

      let bestStage = '—';
      for (const round of [...STAGE_ORDER].reverse()) {
        if (points.some(tp => myTeamIds.includes(tp.team_id) && tp.round === round && tp.points > 0)) {
          bestStage = ROUND_LABELS[round as Round] ?? round;
          break;
        }
      }

      const teamRows = myPicks.map(p => {
        const t = teamById.get(p.team_id);
        const tp = points.filter(x => x.team_id === p.team_id).reduce((s, x) => s + x.points, 0);
        return {
          name: t?.name ?? 'Unknown',
          flag: t?.flag_emoji ?? '',
          tier: t?.tier ?? 0,
          points: tp,
          eliminated: eliminatedIds.has(p.team_id),
        };
      }).sort((a, b) => b.points - a.points);

      const teamsAlive = myTeamIds.filter(id => !eliminatedIds.has(id)).length;

      return {
        user_id: u.id,
        display_name: u.display_name,
        points: total,
        rank: 0,
        teams_alive: teamsAlive,
        best_stage: bestStage,
        teams: teamRows,
      };
    })
    .sort((a, b) => b.points - a.points)
    .map((s, i) => ({ ...s, rank: i + 1 }));
}

export function buildBulletinData(
  standings: PlayerStanding[],
  points: TeamPoints[],
  previousSnapshot: StandingsSnapshotEntry[],
): BulletinData {
  const prevByUser = new Map(previousSnapshot.map(e => [e.user_id, e]));

  const movers = standings
    .map(s => {
      const prev = prevByUser.get(s.user_id);
      return {
        display_name: s.display_name,
        gained: s.points - (prev?.points ?? 0),
        rank: s.rank,
        prev_rank: prev?.rank ?? null,
      };
    })
    .sort((a, b) => b.gained - a.gained);

  const roundsPresent = new Set(points.map(p => p.round));
  const roundsPlayed = STAGE_ORDER.filter(r => roundsPresent.has(r)).map(r => ROUND_LABELS[r]);
  let latestStage: string | null = null;
  for (const round of [...STAGE_ORDER].reverse()) {
    if (roundsPresent.has(round)) { latestStage = ROUND_LABELS[round]; break; }
  }

  const totalPointsScored = points.reduce((s, p) => s + p.points, 0);

  return {
    standings,
    movers,
    roundsPlayed,
    latestStage,
    totalPointsScored,
    hasResults: points.length > 0 && totalPointsScored >= 0 && roundsPlayed.length > 0,
  };
}

// Compact snapshot to persist for next run's mover calculation.
export function snapshotFromStandings(standings: PlayerStanding[]): StandingsSnapshotEntry[] {
  return standings.map(s => ({
    user_id: s.user_id,
    display_name: s.display_name,
    points: s.points,
    rank: s.rank,
  }));
}

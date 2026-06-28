// Single source of truth for "is this team out of the tournament?".
//
// A drafted team is eliminated when EITHER:
//   1. it lost a knockout match — has a knockout-round team_points row worth 0, OR
//   2. it failed to qualify from the group stage — once the Round of 32 draw is
//      published, any team not appearing in the knockout field is out.
//
// (2) can only be applied once the R32 draw is actually populated with real
// teams, so we gate it behind a quorum check to avoid wrongly eliminating
// everyone while fixtures still read "TBD".
import { Team, TeamPoints, KNOCKOUT_ROUNDS } from './types';
import type { FixtureMatch } from '@/app/api/fixtures/route';

// football-data.org → our DB names
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

export function normaliseTeamName(name: string): string {
  return TEAM_NAME_MAP[name] ?? name;
}

const KNOCKOUT_STAGES = [
  'LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS',
  'THIRD_PLACE', 'PLAY_OFF_3RD_PLACE', 'FINAL',
];

// At least this many real qualifiers must be visible in the knockout feed
// before we trust the draw enough to eliminate group-stage casualties.
// (32 teams reach the Round of 32; 24 is a safe "draw is substantially set" bar.)
const QUALIFIER_QUORUM = 24;

/**
 * Lowercased DB names of teams that reached the knockout stage, or `null` when
 * the R32 draw isn't populated enough to trust yet. Only names that match a real
 * team in our DB are counted, so placeholder labels ("Winner Group A") can't
 * inflate the quorum or poison the set.
 */
export function knockoutQualifiers(
  matches: FixtureMatch[],
  teams: Team[],
): Set<string> | null {
  const dbNames = new Set(teams.map(t => t.name.toLowerCase()));
  const qualifiers = new Set<string>();
  for (const m of matches) {
    if (!KNOCKOUT_STAGES.includes(m.stage)) continue;
    for (const raw of [m.homeTeam, m.awayTeam]) {
      const n = normaliseTeamName(raw).toLowerCase();
      if (dbNames.has(n)) qualifiers.add(n);
    }
  }
  return qualifiers.size >= QUALIFIER_QUORUM ? qualifiers : null;
}

/** Set of eliminated team_ids given points data and (optionally) the R32 field. */
export function computeEliminatedTeamIds(
  teams: Team[],
  points: TeamPoints[],
  qualifiers: Set<string> | null,
): Set<string> {
  const eliminated = new Set<string>();

  // 1. Knockout losers
  for (const tp of points) {
    if (KNOCKOUT_ROUNDS.includes(tp.round) && tp.points === 0) {
      eliminated.add(tp.team_id);
    }
  }

  // 2. Group-stage non-qualifiers (only once the draw is known)
  if (qualifiers) {
    for (const t of teams) {
      if (!qualifiers.has(t.name.toLowerCase())) eliminated.add(t.id);
    }
  }

  return eliminated;
}

// Odds model: FIFA-ranking exponential decay → tournament win probability.
// exp(-0.1 * rank): rank1≈0.90, rank5≈0.61, rank10≈0.37, rank20≈0.14, rank50≈0.01
// This differentiates squads by WHICH teams they have within each tier, not just tier counts.
import { GameUser, DraftPick, Team, TeamPoints } from './types';
import { computeEliminatedTeamIds } from './elimination';

export const ODDS_SNAPSHOT_ACTION = 'ODDS_SNAPSHOT';

const RANK_DECAY = 0.3;
const POINTS_WEIGHT = 0.08; // each point ≈ ~1/12th of a rank-5 team's strength
const OVERROUND = 1.12;     // 12% bookmaker margin

function rankStrength(rank: number): number {
  return Math.exp(-RANK_DECAY * Math.max(rank, 1));
}

// Narrative flavour per team — used in blurbs
const TEAM_LINES: Record<string, string> = {
  'France':    '#1 in the world 🇫🇷',
  'Brazil':    'five-time winners 🇧🇷',
  'Argentina': 'defending champs 🏆',
  'England':   "it's coming home 🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  'Germany':   'the machine 🇩🇪',
  'Spain':     'reigning Euro champs 🇪🇸',
  'Portugal':  "Ronaldo's last dance 🐐",
  'USA':       'USA at home 🇺🇸',
  'Canada':    'host nation 🍁',
  'Mexico':    'El Tri at home 🌮',
  'Morocco':   'the disruptor 🌍',
  'Netherlands': 'Total Football reborn 🇳🇱',
};

const MEDALS = ['🥇', '🥈', '🥉', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

const OUTSIDER_QUIPS = [
  'the disrespected outsider 🤫',
  'chaos is a strategy too ⚡',
  'praying for upsets, every round 🙏',
];

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }

function buildBlurb(medal: string, name: string, odds: string, top2: Team[], pos: number, total: number): string {
  const [t1, t2] = top2;
  const t1line = t1 ? TEAM_LINES[t1.name] : null;
  const t2line = t2 ? TEAM_LINES[t2.name] : null;

  let teamRef = '';
  if (t1 && t2) teamRef = `${t1.flag_emoji} ${t1.name} + ${t2.flag_emoji} ${t2.name}`;
  else if (t1) teamRef = `${t1.flag_emoji} ${t1.name}`;

  let suffix: string;
  if (pos === 0) {
    suffix = (t1line && t2line) ? `${t1line} + ${t2line}` : t1line ?? t2line ?? 'the heist 💰';
  } else if (pos === total - 1) {
    return `${medal} *${name} $${odds}* — ${pick(OUTSIDER_QUIPS)}`;
  } else if (pos < Math.ceil(total / 2)) {
    suffix = t1line ?? 'in the mix 👀';
  } else {
    suffix = t1line ?? pick(['value in chaos ⚡', 'one big run changes everything', 'dark horse energy 🐴']);
  }

  return teamRef
    ? `${medal} *${name} $${odds}* — ${teamRef}, ${suffix}`
    : `${medal} *${name} $${odds}* — ${suffix}`;
}

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

export function generateOddsSnapshot(
  users: GameUser[],
  picks: DraftPick[],
  teams: Team[],
  points: TeamPoints[],
  // Lowercased DB names of teams that reached the knockouts (R32 draw), or null
  // when unknown. Drives group-stage eliminations so a knocked-out team's
  // strength stops propping up its owner's odds.
  qualifiers: Set<string> | null = null,
): OddsSnapshot {
  const teamById = new Map(teams.map(t => [t.id, t]));
  const eliminatedIds = computeEliminatedTeamIds(teams, points, qualifiers);

  const computed = users.map(u => {
    const myPicks = picks.filter(p => p.user_id === u.id);
    const currentPoints = points
      .filter(tp => myPicks.some(p => p.team_id === tp.team_id))
      .reduce((s, tp) => s + tp.points, 0);
    const alivePicks = myPicks.filter(p => !eliminatedIds.has(p.team_id));

    const squadStrength = alivePicks.reduce((s, p) => {
      const rank = teamById.get(p.team_id)?.fifa_ranking ?? 80;
      return s + rankStrength(rank);
    }, 0);

    const top2 = alivePicks
      .map(p => teamById.get(p.team_id))
      .filter((t): t is Team => !!t)
      .sort((a, b) => (a.fifa_ranking ?? 999) - (b.fifa_ranking ?? 999))
      .slice(0, 2);

    return {
      user_id: u.id,
      display_name: u.display_name,
      accent_colour: u.accent_colour,
      points: currentPoints,
      teams_alive: alivePicks.length,
      strength: squadStrength + currentPoints * POINTS_WEIGHT,
      top2,
    };
  });

  const totalStrength = computed.reduce((s, r) => s + r.strength, 0);
  const sorted = [...computed].sort((a, b) => b.strength - a.strength);
  const n = sorted.length;

  const rows: OddsEntry[] = sorted.map((r, i) => {
    const raw = totalStrength === 0 || r.strength === 0 ? 0 : totalStrength / (r.strength * OVERROUND);
    const odds = raw === 0 ? '—' : raw.toFixed(2);
    return {
      user_id: r.user_id,
      display_name: r.display_name,
      accent_colour: r.accent_colour,
      points: r.points,
      teams_alive: r.teams_alive,
      odds,
      blurb: buildBlurb(MEDALS[i] ?? `${i + 1}`, r.display_name, odds, r.top2, i, n),
    };
  });

  return { rows, generated_at: new Date().toISOString() };
}

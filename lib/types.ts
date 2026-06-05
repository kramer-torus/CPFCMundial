export interface Player {
  id: string;
  name: string;
  color_hex: string;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  flag_emoji: string;
  confederation: string;
}

export interface DraftPick {
  id: string;
  player_id: string;
  team_id: string;
  pick_number: number;
  picked_at: string;
  player?: Player;
  team?: Team;
}

export interface TeamPoints {
  id: string;
  team_id: string;
  round: Round;
  points: number;
  updated_at: string;
}

export type Round = 'GW1' | 'GW2' | 'GW3' | 'R32' | 'R16' | 'QF' | 'SF' | '3PO' | 'FINAL';

export const ROUNDS: Round[] = ['GW1', 'GW2', 'GW3', 'R32', 'R16', 'QF', 'SF', '3PO', 'FINAL'];
export const KNOCKOUT_ROUNDS: Round[] = ['R32', 'R16', 'QF', 'SF', '3PO', 'FINAL'];

export const TIER_COLORS: Record<number, { bg: string; text: string; label: string }> = {
  1: { bg: 'bg-emerald-600', text: 'text-emerald-100', label: 'Tier 1 · Elite' },
  2: { bg: 'bg-amber-500', text: 'text-amber-100', label: 'Tier 2 · Contenders' },
  3: { bg: 'bg-purple-600', text: 'text-purple-100', label: 'Tier 3 · Dark Horses' },
  4: { bg: 'bg-rose-700', text: 'text-rose-100', label: 'Tier 4 · Underdogs' },
};

export const PLAYER_COLORS = [
  '#C4122E', '#1F3864', '#C9A84C', '#16A34A', '#7C3AED', '#EA580C',
];

export interface PlayerLeaderboard extends Player {
  total_points: number;
  teams_alive: number;
  best_stage: string;
}

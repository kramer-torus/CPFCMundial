export interface GameUser {
  id: string;
  display_name: string;
  pin_hash: string;
  is_admin: boolean;
  accent_colour: string;
  draft_position?: number | null;
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
  user_id: string;
  team_id: string;
  pick_number: number;
  tier: number;
  picked_at: string;
  user?: GameUser;
  team?: Team;
}

export interface TeamPoints {
  id: string;
  team_id: string;
  round: Round;
  points: number;
  updated_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  detail: string;
  created_at: string;
}

export type Round = 'GW1' | 'GW2' | 'GW3' | 'R32' | 'R16' | 'QF' | 'SF' | '3PO' | 'FINAL';
export const ROUNDS: Round[] = ['GW1', 'GW2', 'GW3', 'R32', 'R16', 'QF', 'SF', '3PO', 'FINAL'];
export const KNOCKOUT_ROUNDS: Round[] = ['R32', 'R16', 'QF', 'SF', '3PO', 'FINAL'];
export const ROUND_LABELS: Record<Round, string> = {
  GW1: 'Group W1', GW2: 'Group W2', GW3: 'Group W3',
  R32: 'Round of 32', R16: 'Round of 16', QF: 'Quarters',
  SF: 'Semis', '3PO': '3rd Place', FINAL: 'Final',
};

export const STAGE_ORDER: Round[] = ['GW1','GW2','GW3','R32','R16','QF','SF','3PO','FINAL'];

export const TIER_COLORS: Record<number, { bg: string; text: string; border: string; label: string }> = {
  1: { bg: 'bg-emerald-600/20', text: 'text-emerald-400', border: 'border-emerald-600/40', label: 'Elite' },
  2: { bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/40', label: 'Contenders' },
  3: { bg: 'bg-purple-600/20', text: 'text-purple-400', border: 'border-purple-600/40', label: 'Dark Horses' },
  4: { bg: 'bg-rose-700/20', text: 'text-rose-400', border: 'border-rose-700/40', label: 'Underdogs' },
};

export interface Session {
  id: string;
  display_name: string;
  is_admin: boolean;
  accent_colour: string;
}

export interface PlayerLeaderboard extends GameUser {
  total_points: number;
  teams_alive: number;
  best_stage: string;
  points_delta: number;
}

import { Team } from './types';

// NOTE: IDs are placeholders – real IDs come from Supabase after seeding
export const TEAMS_DATA: Omit<Team, 'id'>[] = [
  // Tier 1 – Elite (12)
  { name: 'Brazil',       tier: 1, flag_emoji: '🇧🇷', confederation: 'CONMEBOL' },
  { name: 'France',       tier: 1, flag_emoji: '🇫🇷', confederation: 'UEFA' },
  { name: 'England',      tier: 1, flag_emoji: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', confederation: 'UEFA' },
  { name: 'Argentina',    tier: 1, flag_emoji: '🇦🇷', confederation: 'CONMEBOL' },
  { name: 'Spain',        tier: 1, flag_emoji: '🇪🇸', confederation: 'UEFA' },
  { name: 'Germany',      tier: 1, flag_emoji: '🇩🇪', confederation: 'UEFA' },
  { name: 'Portugal',     tier: 1, flag_emoji: '🇵🇹', confederation: 'UEFA' },
  { name: 'Netherlands',  tier: 1, flag_emoji: '🇳🇱', confederation: 'UEFA' },
  { name: 'Uruguay',      tier: 1, flag_emoji: '🇺🇾', confederation: 'CONMEBOL' },
  { name: 'Belgium',      tier: 1, flag_emoji: '🇧🇪', confederation: 'UEFA' },
  { name: 'USA',          tier: 1, flag_emoji: '🇺🇸', confederation: 'CONCACAF' },
  { name: 'Colombia',     tier: 1, flag_emoji: '🇨🇴', confederation: 'CONMEBOL' },
  // Tier 2 – Contenders (12)
  { name: 'Croatia',      tier: 2, flag_emoji: '🇭🇷', confederation: 'UEFA' },
  { name: 'Denmark',      tier: 2, flag_emoji: '🇩🇰', confederation: 'UEFA' },
  { name: 'Switzerland',  tier: 2, flag_emoji: '🇨🇭', confederation: 'UEFA' },
  { name: 'Mexico',       tier: 2, flag_emoji: '🇲🇽', confederation: 'CONCACAF' },
  { name: 'Morocco',      tier: 2, flag_emoji: '🇲🇦', confederation: 'CAF' },
  { name: 'Senegal',      tier: 2, flag_emoji: '🇸🇳', confederation: 'CAF' },
  { name: 'Japan',        tier: 2, flag_emoji: '🇯🇵', confederation: 'AFC' },
  { name: 'Australia',    tier: 2, flag_emoji: '🇦🇺', confederation: 'AFC' },
  { name: 'Poland',       tier: 2, flag_emoji: '🇵🇱', confederation: 'UEFA' },
  { name: 'Ecuador',      tier: 2, flag_emoji: '🇪🇨', confederation: 'CONMEBOL' },
  { name: 'South Korea',  tier: 2, flag_emoji: '🇰🇷', confederation: 'AFC' },
  { name: 'Serbia',       tier: 2, flag_emoji: '🇷🇸', confederation: 'UEFA' },
  // Tier 3 – Dark Horses (12)
  { name: 'Canada',       tier: 3, flag_emoji: '🇨🇦', confederation: 'CONCACAF' },
  { name: 'Turkey',       tier: 3, flag_emoji: '🇹🇷', confederation: 'UEFA' },
  { name: 'Costa Rica',   tier: 3, flag_emoji: '🇨🇷', confederation: 'CONCACAF' },
  { name: 'Tunisia',      tier: 3, flag_emoji: '🇹🇳', confederation: 'CAF' },
  { name: 'Cameroon',     tier: 3, flag_emoji: '🇨🇲', confederation: 'CAF' },
  { name: 'Saudi Arabia', tier: 3, flag_emoji: '🇸🇦', confederation: 'AFC' },
  { name: 'Ukraine',      tier: 3, flag_emoji: '🇺🇦', confederation: 'UEFA' },
  { name: 'Scotland',     tier: 3, flag_emoji: '🏴󠁧󠁢󠁳󠁣󠁴󠁿', confederation: 'UEFA' },
  { name: 'Austria',      tier: 3, flag_emoji: '🇦🇹', confederation: 'UEFA' },
  { name: 'Ghana',        tier: 3, flag_emoji: '🇬🇭', confederation: 'CAF' },
  { name: 'Panama',       tier: 3, flag_emoji: '🇵🇦', confederation: 'CONCACAF' },
  { name: 'Venezuela',    tier: 3, flag_emoji: '🇻🇪', confederation: 'CONMEBOL' },
  // Tier 4 – Underdogs (12)
  { name: 'Iran',         tier: 4, flag_emoji: '🇮🇷', confederation: 'AFC' },
  { name: 'Indonesia',    tier: 4, flag_emoji: '🇮🇩', confederation: 'AFC' },
  { name: 'Jamaica',      tier: 4, flag_emoji: '🇯🇲', confederation: 'CONCACAF' },
  { name: 'New Zealand',  tier: 4, flag_emoji: '🇳🇿', confederation: 'OFC' },
  { name: 'Albania',      tier: 4, flag_emoji: '🇦🇱', confederation: 'UEFA' },
  { name: 'Slovenia',     tier: 4, flag_emoji: '🇸🇮', confederation: 'UEFA' },
  { name: 'Bolivia',      tier: 4, flag_emoji: '🇧🇴', confederation: 'CONMEBOL' },
  { name: 'Honduras',     tier: 4, flag_emoji: '🇭🇳', confederation: 'CONCACAF' },
  { name: 'DR Congo',     tier: 4, flag_emoji: '🇨🇩', confederation: 'CAF' },
  { name: 'Guinea',       tier: 4, flag_emoji: '🇬🇳', confederation: 'CAF' },
  { name: 'Iraq',         tier: 4, flag_emoji: '🇮🇶', confederation: 'AFC' },
  { name: 'Paraguay',     tier: 4, flag_emoji: '🇵🇾', confederation: 'CONMEBOL' },
];

// Draft snake order for pick_number 1..48
// 6 players, 8 rounds (2 per tier × 4 tiers)
// Even rounds (0,2,4,6): ascending; Odd rounds (1,3,5,7): descending
export function getDraftOrder(playerIds: string[]): string[] {
  const order: string[] = [];
  for (let round = 0; round < 8; round++) {
    const ascending = round % 2 === 0;
    for (let pos = 0; pos < 6; pos++) {
      const idx = ascending ? pos : 5 - pos;
      order.push(playerIds[idx]);
    }
  }
  return order; // 48 entries
}

export function getTierForPick(pickNumber: number): 1 | 2 | 3 | 4 {
  const roundIndex = Math.floor((pickNumber - 1) / 6); // 0-7
  return (Math.floor(roundIndex / 2) + 1) as 1 | 2 | 3 | 4;
}

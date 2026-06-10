// 8 players, 6 rounds of 8 picks = 48 total
// 3 tiers of 16 teams — 2 picks per tier per player

export function getPlayerIndexForPick(pickNumber: number): number {
  const pickIndex = pickNumber - 1;
  const roundIndex = Math.floor(pickIndex / 8);  // 0–5
  const posInRound = pickIndex % 8;              // 0–7
  const ascending = roundIndex % 2 === 0;
  return ascending ? posInRound : 7 - posInRound;
}

export function getTierForPickNumber(pickNumber: number): 1 | 2 | 3 {
  return (Math.floor((pickNumber - 1) / 16) + 1) as 1 | 2 | 3;
}

export function getSnakeDirection(pickNumber: number): 'forward' | 'reverse' {
  const roundIndex = Math.floor((pickNumber - 1) / 8);
  return roundIndex % 2 === 0 ? 'forward' : 'reverse';
}

export function getPointsForResult(
  result: 'win' | 'draw' | 'loss' | 'runner-up',
  round: string
): number {
  if (round === 'FINAL') {
    if (result === 'win') return 5;
    if (result === 'runner-up') return 3;
    return 0;
  }
  if (round === '3PO') return result === 'win' ? 2 : 0;
  if (['GW1', 'GW2', 'GW3'].includes(round)) {
    if (result === 'win') return 3;
    if (result === 'draw') return 1;
    return 0;
  }
  return result === 'win' ? 3 : 0;
}

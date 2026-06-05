export function getDraftSnakeOrder(playerIds: string[]): string[] {
  const order: string[] = [];
  for (let round = 0; round < 8; round++) {
    const ascending = round % 2 === 0;
    for (let pos = 0; pos < 6; pos++) {
      const idx = ascending ? pos : 5 - pos;
      order.push(playerIds[idx]);
    }
  }
  return order;
}

export function getTierForPickNumber(pickNumber: number): 1 | 2 | 3 | 4 {
  const roundIndex = Math.floor((pickNumber - 1) / 6);
  return (Math.floor(roundIndex / 2) + 1) as 1 | 2 | 3 | 4;
}

export function getPointsForResult(
  result: 'win' | 'draw' | 'loss' | 'eliminated' | 'runner-up' | '3rd',
  round: string
): number {
  if (round === 'FINAL') {
    if (result === 'win') return 5;
    if (result === 'runner-up') return 3;
    return 0;
  }
  if (round === '3PO') {
    if (result === 'win') return 2;
    return 0;
  }
  // Group stage
  if (['GW1', 'GW2', 'GW3'].includes(round)) {
    if (result === 'win') return 3;
    if (result === 'draw') return 1;
    return 0;
  }
  // Knockout
  if (result === 'win') return 3;
  return 0;
}

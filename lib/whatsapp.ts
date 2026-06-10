const GRAPH_API = 'https://graph.facebook.com/v20.0';

async function send(to: string, text: string): Promise<boolean> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_ID;
  if (!token || !phoneId) return false;

  const number = to.replace(/\D/g, '');
  if (!number) return false;

  const res = await fetch(`${GRAPH_API}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: number,
      type: 'text',
      text: { body: text, preview_url: false },
    }),
  });
  return res.ok;
}

export async function notifyDraftTurn(playerName: string, phone: string, pickNumber: number, tier: number): Promise<void> {
  const tierNames = ['', 'Elite', 'Contenders', 'Dark Horses', 'Wildcards'];
  await send(
    phone,
    `🦅 *CPFCMundial Draft*\n\n⭐ It's your turn, ${playerName}!\n\nPick #${pickNumber} — Tier ${tier} (${tierNames[tier]})\n\nOpen the app to make your pick:\nhttps://cpfc-mundial.vercel.app/draft`,
  );
}

export async function sendQuizReminder(playerName: string, phone: string): Promise<void> {
  await send(
    phone,
    `🦅 *CPFCMundial — The Gauntlet*\n\nHey ${playerName}! 🔥 You haven't completed The Gauntlet yet.\n\nYour score determines your draft pick order — get in there!\n\nhttps://cpfc-mundial.vercel.app/quiz`,
  );
}

export async function postLeaderboard(board: { name: string; pts: number; alive: number }[]): Promise<boolean[]> {
  // Leaderboard is broadcast — returns an array of send results per phone
  // This is called from the API route which has access to phone numbers
  const lines = board
    .map((p, i) => `${['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`} ${p.name.padEnd(14)} ${String(p.pts).padStart(4)} pts  (${p.alive} alive)`)
    .join('\n');
  const text = `🦅 *CPFCMundial Leaderboard*\n\n${lines}\n\nhttps://cpfc-mundial.vercel.app`;
  return []; // caller supplies phones and maps over them
  void text; // exported for reuse
}

export function buildLeaderboardMessage(board: { name: string; pts: number; alive: number }[]): string {
  const lines = board
    .map((p, i) => `${['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`} ${p.name.padEnd(14)} ${String(p.pts).padStart(4)} pts  (${p.alive} alive)`)
    .join('\n');
  return `🦅 *CPFCMundial Leaderboard*\n\n\`\`\`\n${lines}\n\`\`\`\n\nhttps://cpfc-mundial.vercel.app`;
}

export { send as sendRawWhatsApp };

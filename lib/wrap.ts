// Daily Wrap generator — produces a lively, data-driven banter digest with no
// external LLM. Stored in the audit_log table (action = DAILY_WRAP) so no extra
// table/migration is needed.
import { BulletinData, StandingsSnapshotEntry } from './standings';

export const DAILY_WRAP_ACTION = 'DAILY_WRAP';

export interface WrapDetail {
  title: string;
  body: string;
  snapshot: StandingsSnapshotEntry[];
}

const MEDALS = ['🥇', '🥈', '🥉'];

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const KICKOFF_HOOKS = [
  'Squads are locked, the balls are out, and there is officially nowhere left to hide. 🌍',
  'No points on the board yet — but the bragging has already started. Let battle commence. ⚔️',
  'The wait is over. 48 nations, 6 managers, one trophy. Boots on. 🥾',
];

const LEVEL_HOOKS = [
  'Still all square at the top — nobody has thrown a punch yet. 😴',
  'Tight at the summit. One result could blow this wide open. 👀',
];

const LEADER_LINES = [
  (n: string) => `${n} sets the early pace and will absolutely not shut up about it. 🗣️`,
  (n: string) => `${n} leads the pack — get the name on the trophy, eh? 🏆`,
  (n: string) => `${n} out in front. Front-runners always crack though, right? 😏`,
];

const BOTTOM_LINES = [
  (n: string) => `${n} props up the table. Someone has to. 🪜`,
  (n: string) => `Spare a thought for ${n}, currently auditioning for the wooden spoon. 🥄`,
  (n: string) => `${n} bottom of the pile — early days, but, well… 😬`,
];

const NO_MOVE_LINES = [
  'Quiet day — nobody troubled the scorers. Awkward silence in the group chat. 🦗',
  'No movement since the last wrap. The leaderboard is gathering dust. 🕸️',
];

export function generateWrapBody(data: BulletinData, wrapNumber: number): string {
  const lines: string[] = [];
  lines.push(`🏆 *CPFC MUNDIAL — DAILY WRAP #${wrapNumber}*`);

  const divider = '━━━━━━━━━━━━━━';

  // Hook
  if (!data.hasResults) {
    lines.push(pick(KICKOFF_HOOKS));
  } else {
    const top = data.standings[0];
    const allLevel = data.standings.every(s => s.points === top.points);
    lines.push(allLevel ? pick(LEVEL_HOOKS) : pick(LEADER_LINES)(top.display_name));
  }

  lines.push('');
  lines.push(divider);
  lines.push('*📊 STANDINGS*');
  data.standings.forEach((s, i) => {
    const badge = MEDALS[i] ?? `${i + 1}.`;
    const alive = data.hasResults ? `  ·  ${s.teams_alive} alive` : '';
    lines.push(`${badge} *${s.display_name}* — ${s.points} pt${s.points === 1 ? '' : 's'}${alive}`);
  });

  // Movers
  if (data.hasResults) {
    const realMovers = data.movers.filter(m => m.gained > 0);
    lines.push('');
    lines.push(divider);
    lines.push('*📈 ON THE MOVE*');
    if (realMovers.length === 0) {
      lines.push(pick(NO_MOVE_LINES));
    } else {
      realMovers.slice(0, 3).forEach(m => {
        const climb = m.prev_rank && m.prev_rank > m.rank ? ` ⬆️ up to ${m.rank}` : '';
        lines.push(`🔥 *${m.display_name}* +${m.gained} pt${m.gained === 1 ? '' : 's'}${climb}`);
      });
    }

    // Banter — leader hype + bottom jab when there's separation
    const top = data.standings[0];
    const bottom = data.standings[data.standings.length - 1];
    if (top.points !== bottom.points) {
      lines.push('');
      lines.push(divider);
      lines.push(pick(LEADER_LINES)(top.display_name));
      lines.push(pick(BOTTOM_LINES)(bottom.display_name));
    }

    // Eliminations callout
    const knockedOut = data.standings.flatMap(s =>
      s.teams.filter(t => t.eliminated).map(t => `${t.flag} ${t.name} (${s.display_name})`),
    );
    if (knockedOut.length > 0) {
      lines.push('');
      lines.push(divider);
      lines.push('*💀 GONE*');
      lines.push(knockedOut.slice(0, 6).join(' · '));
    }
  } else {
    // Pre-tournament flavour
    lines.push('');
    lines.push(divider);
    lines.push('Standings are level — as they should be. Points start landing once the football does. ⚽');
  }

  lines.push('');
  lines.push(divider);
  lines.push(data.latestStage ? `Stage: *${data.latestStage}*` : 'Group stage incoming.');
  lines.push('Glad All Over the World 🦅');

  return lines.join('\n');
}

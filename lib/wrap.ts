// Daily Wrap generator — data-driven digest focused on odds shifts and
// position changes from the day's results. No external LLM.
import { BulletinData, OddsRecord } from './standings';

export const DAILY_WRAP_ACTION = 'DAILY_WRAP';

export interface WrapDetail {
  title: string;
  body: string;
  snapshot: { user_id: string; display_name: string; points: number; rank: number }[];
  odds: OddsRecord[];
}

const MEDALS = ['🥇', '🥈', '🥉'];
const divider = '━━━━━━━━━━━━━━';

function oddsNum(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function arrowLabel(prev: string, curr: string): string {
  const p = oddsNum(prev); const c = oddsNum(curr);
  if (p === null || c === null || Math.abs(p - c) < 0.05) return '';
  // shorter odds = better (more likely to win)
  return c < p ? ` ▼ _(was $${prev})_` : ` ▲ _(was $${prev})_`;
}

export function generateWrapBody(data: BulletinData, wrapNumber: number): string {
  const lines: string[] = [];
  const stage = data.latestStage ?? 'Group Stage';
  lines.push(`🏆 *CPFC MUNDIAL — DAILY WRAP #${wrapNumber} · ${stage}*`);
  lines.push('');

  // ── Opening hook ── driven by actual data, not random pick ──────────
  const top = data.standings[0];
  const btm = data.standings[data.standings.length - 1];
  const topGainer = [...data.movers].sort((a, b) => b.gained - a.gained)[0];
  const topOddsShift = data.oddsShifts?.[0];

  if (!data.hasResults) {
    lines.push('Squads are locked. The balls are out. 48 nations, one trophy. ⚽');
  } else if (topGainer?.gained >= 9) {
    const squad = data.standings.find(s => s.display_name === topGainer.display_name);
    const starTeam = squad?.teams[0];
    lines.push(
      `*${topGainer.display_name}* had the day of the tournament so far — ` +
      `+${topGainer.gained} pts${starTeam ? ` with ${starTeam.flag} ${starTeam.name} leading the charge` : ''}. 🔥`
    );
  } else if (topOddsShift && Math.abs(topOddsShift.delta) >= 0.5) {
    if (topOddsShift.direction === 'shorter') {
      lines.push(`The market is moving. *${topOddsShift.displayName}* is closing in — odds shortening after today's results. 📉`);
    } else {
      lines.push(`*${topOddsShift.displayName}*'s odds drifted after today. The group chat will be talking. 📈`);
    }
  } else if (data.movers.every(m => m.gained === 0)) {
    lines.push(`Rest day. No points on the board. Leaderboard unchanged, banter levels critical. 🦗`);
  } else {
    const gap = top.points - btm.points;
    lines.push(
      gap === 0
        ? `All square at the top — ${data.standings.length}-way tie. This is anyones tournament. ⚡`
        : `Results in. *${top.display_name}* still leads, ${gap} pts clear. More below. 🧮`
    );
  }

  // ── Standings ────────────────────────────────────────────────────────
  lines.push('');
  lines.push(divider);
  lines.push('*📊 STANDINGS*');
  data.standings.forEach((s, i) => {
    const badge = MEDALS[i] ?? `${i + 1}.`;
    const mover = data.movers.find(m => m.display_name === s.display_name);
    const gained = mover?.gained ?? 0;
    const rankChange =
      mover?.prev_rank != null && mover.prev_rank !== s.rank
        ? mover.prev_rank > s.rank ? ' ⬆️' : ' ⬇️'
        : '';
    const gainStr = gained > 0 ? `  *+${gained}*` : '';
    lines.push(`${badge}${rankChange} *${s.display_name}* — ${s.points} pts · ${s.teams_alive} alive${gainStr}`);
  });

  // ── Live odds with movement ──────────────────────────────────────────
  if (data.currentOdds && data.currentOdds.length > 0) {
    lines.push('');
    lines.push(divider);
    lines.push('*🎲 LIVE ODDS*');
    data.currentOdds.forEach((o, i) => {
      const prev = data.previousOdds?.find(p => p.user_id === o.user_id);
      const arrow = prev ? arrowLabel(prev.odds, o.odds) : '';
      lines.push(`${i + 1}. *${o.display_name}* $${o.odds}${arrow}`);
    });
    const shortened = data.oddsShifts?.filter(s => s.direction === 'shorter') ?? [];
    const drifted   = data.oddsShifts?.filter(s => s.direction === 'longer') ?? [];
    if (shortened.length > 0 || drifted.length > 0) {
      lines.push('');
      if (shortened.length > 0)
        lines.push(`_▼ shortening: ${shortened.map(s => s.displayName).join(', ')}_`);
      if (drifted.length > 0)
        lines.push(`_▲ drifting: ${drifted.map(s => s.displayName).join(', ')}_`);
    }
  }

  // ── Today's points earners ───────────────────────────────────────────
  const earners = data.movers.filter(m => m.gained > 0);
  if (earners.length > 0) {
    lines.push('');
    lines.push(divider);
    lines.push('*📈 TODAY\'S EARNERS*');
    for (const m of earners) {
      const squad = data.standings.find(s => s.display_name === m.display_name);
      // Find which teams scored for this player today
      const contributors = squad?.teams
        .filter(t => t.todayPoints && t.todayPoints > 0)
        .map(t => `${t.flag} ${t.name}`) ?? [];
      const teamStr = contributors.length > 0 ? ` — ${contributors.join(', ')}` : '';
      lines.push(`🔥 *${m.display_name}* +${m.gained} pt${m.gained === 1 ? '' : 's'}${teamStr}`);
    }
  }

  // ── Eliminations ─────────────────────────────────────────────────────
  const knockedOut = data.standings.flatMap(s =>
    s.teams.filter(t => t.eliminated && t.eliminatedToday).map(t => `${t.flag} ${t.name} _(${s.display_name})_`)
  );
  if (knockedOut.length > 0) {
    lines.push('');
    lines.push(divider);
    lines.push('*💀 ELIMINATED TODAY*');
    lines.push(knockedOut.join(' · '));
  }

  // ── Banter footer — generated from data, not random ──────────────────
  lines.push('');
  lines.push(divider);
  const gap = top.points - btm.points;
  const topOdds = data.currentOdds?.[0];
  const btmOdds = data.currentOdds?.[data.currentOdds.length - 1];

  if (gap >= 12) {
    lines.push(`${top.display_name} is ${gap} pts clear. Is this already over? 😅`);
  } else if (gap <= 3 && data.hasResults) {
    lines.push(`${gap === 0 ? 'Deadlocked.' : `${gap} pts`} between first and last. Genuinely anyone's. ⚡`);
  } else if (topOdds && btmOdds && topOdds.odds !== '—' && btmOdds.odds !== '—') {
    lines.push(
      `${top.display_name} favourite at $${topOdds.odds}. ` +
      `${btm.display_name} the longest shot at $${btmOdds.odds}. One good day changes everything. 🌀`
    );
  } else {
    lines.push(`${top.display_name} leads — but the knockouts rewrite everything. 🌀`);
  }
  lines.push('Glad All Over the World 🦅');

  return lines.join('\n');
}

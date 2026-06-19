'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { GameUser, DraftPick, Team, TeamPoints, KNOCKOUT_ROUNDS } from '@/lib/types';

// pick_number for a given (roundIdx 0-7, playerIdx 0-5) in snake order
function pickNumForCell(roundIdx: number, playerIdx: number): number {
  const pos = roundIdx % 2 === 0 ? playerIdx : 5 - playerIdx;
  return roundIdx * 6 + pos + 1;
}

const TIER_FOR_ROUND = [1, 1, 2, 2, 3, 3, 4, 4];
const TIER_COLOURS = ['', '#FFD700', '#A8B5C8', '#CD9A5C', '#9B8AB0'];
const TIER_BG     = ['', 'rgba(255,215,0,0.08)', 'rgba(168,181,200,0.06)', 'rgba(205,154,92,0.07)', 'rgba(155,138,176,0.06)'];

interface CellData {
  pickNumber: number;
  team: Team | null;
  points: number;
  eliminated: boolean;
}

interface PageData {
  players: GameUser[];      // sorted by draft_position
  grid: CellData[][];       // [roundIdx 0-7][playerIdx 0-5]
  totalPts: Map<string, number>;
}

function buildGrid(
  users: GameUser[],
  picks: DraftPick[],
  teams: Team[],
  points: TeamPoints[],
): PageData {
  const players = [...users].sort((a, b) => (a.draft_position ?? 99) - (b.draft_position ?? 99));
  const teamById = new Map(teams.map(t => [t.id, t]));
  const pickByNum = new Map(picks.map(p => [p.pick_number, p]));
  const eliminatedIds = new Set(
    points.filter(tp => KNOCKOUT_ROUNDS.includes(tp.round) && tp.points === 0).map(tp => tp.team_id),
  );
  const ptsByTeam = new Map<string, number>();
  for (const tp of points) {
    ptsByTeam.set(tp.team_id, (ptsByTeam.get(tp.team_id) ?? 0) + tp.points);
  }

  const totalPts = new Map<string, number>();
  for (const user of players) {
    const myPicks = picks.filter(p => p.user_id === user.id);
    const total = myPicks.reduce((s, p) => s + (ptsByTeam.get(p.team_id) ?? 0), 0);
    totalPts.set(user.id, total);
  }

  const grid: CellData[][] = Array.from({ length: 8 }, (_, roundIdx) =>
    Array.from({ length: 6 }, (_, playerIdx) => {
      const pickNumber = pickNumForCell(roundIdx, playerIdx);
      const pick = pickByNum.get(pickNumber);
      if (!pick) return { pickNumber, team: null, points: 0, eliminated: false };
      const team = teamById.get(pick.team_id) ?? null;
      const pts = ptsByTeam.get(pick.team_id) ?? 0;
      return { pickNumber, team, points: pts, eliminated: eliminatedIds.has(pick.team_id) };
    }),
  );

  return { players, grid, totalPts };
}

export default function DraftResultsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [usersRes, picksRes, teamsRes, pointsRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('draft_picks').select('*'),
      supabase.from('teams').select('*'),
      supabase.from('team_points').select('*'),
    ]);
    const users = (usersRes.data ?? []) as GameUser[];
    const picks = (picksRes.data ?? []) as DraftPick[];
    const teams = (teamsRes.data ?? []) as Team[];
    const points = (pointsRes.data ?? []) as TeamPoints[];
    if (picks.length > 0) setData(buildGrid(users, picks, teams, points));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('draft-results-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_points' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  return (
    <div className="page-fade">
      {/* Header */}
      <div className="-mx-4 px-6 py-8 mb-5" style={{ background: 'linear-gradient(160deg,#1a0a1a 0%,#2d1a3a 30%,#0F1923 70%,#1F3864 100%)' }}>
        <h1 className="font-display font-bold text-5xl text-white leading-none tracking-wide">DRAFT</h1>
        <p className="text-white/50 text-sm mt-1.5 uppercase tracking-widest">2026 World Cup · Snake Draft Board</p>
      </div>

      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-bg-card rounded-xl animate-pulse" />)}</div>
      ) : !data ? (
        <div className="card text-center py-12 space-y-4">
          <div className="text-5xl">🦅</div>
          <p className="font-display font-bold text-2xl text-white tracking-wide">DRAFT NOT STARTED</p>
        </div>
      ) : (
        <>
          {/* Player totals strip */}
          <div className="overflow-x-auto pb-1 -mx-4 px-4">
            <div className="flex gap-2 min-w-max">
              {data.players.map((p, i) => (
                <div key={p.id} className="flex flex-col items-center gap-1 rounded-xl px-3 py-2 border border-white/8" style={{ background: p.accent_colour + '18', minWidth: 90 }}>
                  <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color: p.accent_colour }}>
                    {i === 0 ? '1st' : i === 1 ? '2nd' : i === 2 ? '3rd' : `${i + 1}th`} pick
                  </span>
                  <span className="font-display font-bold text-sm text-white leading-tight text-center">{p.display_name}</span>
                  <span className="font-display font-bold text-lg leading-none" style={{ color: p.accent_colour }}>{data.totalPts.get(p.id) ?? 0}</span>
                  <span className="text-white/30 text-[9px] uppercase tracking-wider">pts</span>
                </div>
              ))}
            </div>
          </div>

          {/* Draft board grid */}
          <div className="mt-5 overflow-x-auto -mx-4 px-4">
            <div style={{ minWidth: 6 * 108 + 44 }}>
              {/* Column headers */}
              <div className="flex mb-1">
                <div style={{ width: 44, flexShrink: 0 }} />
                {data.players.map(p => (
                  <div key={p.id} className="flex-1 text-center text-[10px] font-bold uppercase tracking-wider truncate px-1 pb-1" style={{ color: p.accent_colour, minWidth: 108 }}>
                    {p.display_name}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {data.grid.map((row, roundIdx) => {
                const tier = TIER_FOR_ROUND[roundIdx];
                const isSnakeReverse = roundIdx % 2 !== 0;
                const showTierDivider = roundIdx > 0 && TIER_FOR_ROUND[roundIdx] !== TIER_FOR_ROUND[roundIdx - 1];
                return (
                  <div key={roundIdx}>
                    {showTierDivider && (
                      <div className="flex items-center gap-2 my-2 px-1">
                        <div className="flex-1 h-px" style={{ background: TIER_COLOURS[tier] + '40' }} />
                        <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full" style={{ color: TIER_COLOURS[tier], background: TIER_BG[tier] }}>
                          Tier {tier}
                        </span>
                        <div className="flex-1 h-px" style={{ background: TIER_COLOURS[tier] + '40' }} />
                      </div>
                    )}
                    <div className="flex gap-1 mb-1">
                      {/* Row label */}
                      <div className="flex flex-col items-center justify-center gap-0.5 rounded-lg" style={{ width: 44, flexShrink: 0, background: TIER_BG[tier] }}>
                        <span className="text-[8px] font-bold uppercase tracking-wider" style={{ color: TIER_COLOURS[tier] }}>R{roundIdx + 1}</span>
                        {isSnakeReverse && <span className="text-white/20 text-[8px]">↩</span>}
                      </div>
                      {/* Cells */}
                      {row.map((cell, playerIdx) => (
                        <DraftCell key={playerIdx} cell={cell} colour={data.players[playerIdx]?.accent_colour ?? '#fff'} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1.5 text-[10px] text-white/30 uppercase tracking-wider">
            <span>↩ = snake reverse</span>
            <span className="text-rose-400/60">Eliminated</span>
            <span className="text-emerald-400/60">Still In It</span>
          </div>
        </>
      )}
    </div>
  );
}

function DraftCell({ cell, colour }: { cell: CellData; colour: string }) {
  if (!cell.team) {
    return (
      <div className="flex-1 rounded-lg border border-white/5 flex items-center justify-center" style={{ minWidth: 108, minHeight: 72, background: '#0a1118' }}>
        <span className="text-white/15 text-xs">—</span>
      </div>
    );
  }
  return (
    <div
      className={`flex-1 rounded-lg border flex flex-col justify-between px-2 py-1.5 ${cell.eliminated ? 'opacity-45' : ''}`}
      style={{ minWidth: 108, minHeight: 72, borderColor: colour + '28', background: colour + '0a' }}
    >
      <div className="flex items-start gap-1.5">
        <span className="text-xl leading-none flex-shrink-0">{cell.team.flag_emoji}</span>
        <span className="text-white text-[11px] font-semibold leading-tight">{cell.team.name}</span>
      </div>
      <div className="flex items-center justify-between mt-1">
        <span className="text-[9px] uppercase tracking-wider" style={{ color: colour + 'aa' }}>
          #{cell.pickNumber}
        </span>
        {cell.eliminated ? (
          <span className="text-[8px] font-bold text-rose-400/70 uppercase">Out</span>
        ) : (
          <span className="font-display font-bold text-sm" style={{ color: cell.points > 0 ? '#FFD700' : colour + '55' }}>
            {cell.points > 0 ? cell.points : '—'}
          </span>
        )}
      </div>
    </div>
  );
}

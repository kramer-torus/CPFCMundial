'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Player, DraftPick, TeamPoints } from '@/lib/types';
import ShareButton from '@/components/ShareButton';

interface PlayerLeaderboard extends Player {
  total_points: number;
  teams_alive: number;
  best_stage: string;
}

const ROUND_ORDER: Record<string, number> = {
  GW1: 1, GW2: 2, GW3: 3, R32: 4, R16: 5, QF: 6, SF: 7, '3PO': 8, FINAL: 9,
};

function getRankBadge(rank: number): string {
  if (rank === 1) return '🥇';
  if (rank === 2) return '🥈';
  if (rank === 3) return '🥉';
  return `#${rank}`;
}

function getBestStage(teamIds: string[], teamPoints: TeamPoints[]): string {
  let best = '';
  let bestOrder = 0;
  for (const tp of teamPoints) {
    if (teamIds.includes(tp.team_id) && tp.points > 0) {
      const order = ROUND_ORDER[tp.round] || 0;
      if (order > bestOrder) {
        bestOrder = order;
        best = tp.round;
      }
    }
  }
  return best;
}

function isTeamEliminated(teamId: string, teamPoints: TeamPoints[]): boolean {
  const knockoutRounds = ['R32', 'R16', 'QF', 'SF', '3PO', 'FINAL'];
  return teamPoints.some(
    tp => tp.team_id === teamId && knockoutRounds.includes(tp.round) && tp.points === 0
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="card animate-pulse h-20 bg-white/5" />
      ))}
    </div>
  );
}

function PlayerCard({
  player,
  rank,
}: {
  player: PlayerLeaderboard;
  rank: number;
}) {
  const badge = getRankBadge(rank);
  const teamsPerPlayer = 8;

  return (
    <Link href={`/player/${player.id}`}>
      <div
        className="card flex items-center gap-3 hover:bg-white/20 transition-colors cursor-pointer"
        style={{ borderLeft: `4px solid ${player.color_hex}` }}
      >
        <div className="text-2xl w-10 text-center flex-shrink-0">
          {badge.startsWith('#') ? (
            <span className="text-lg font-bold text-white/50">{badge}</span>
          ) : (
            <span>{badge}</span>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white truncate">{player.name}</div>
          <div className="text-xs text-white/50 flex items-center gap-2 mt-0.5">
            <span>{player.teams_alive}/{teamsPerPlayer} alive</span>
            {player.best_stage && (
              <>
                <span>&middot;</span>
                <span className="text-gold">Best: {player.best_stage}</span>
              </>
            )}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <div className="text-2xl font-extrabold text-gold">{player.total_points}</div>
          <div className="text-xs text-white/50">pts</div>
        </div>
      </div>
    </Link>
  );
}

export default function HomePage() {
  const [leaderboard, setLeaderboard] = useState<PlayerLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalPicks, setTotalPicks] = useState(0);

  const fetchData = useCallback(async () => {
    const [playersRes, picksRes, pointsRes] = await Promise.all([
      supabase.from('players').select('*').order('created_at', { ascending: true }),
      supabase.from('draft_picks').select('*'),
      supabase.from('team_points').select('*'),
    ]);

    const players: Player[] = playersRes.data || [];
    const picks: DraftPick[] = picksRes.data || [];
    const points: TeamPoints[] = pointsRes.data || [];

    setTotalPicks(picks.length);

    const board: PlayerLeaderboard[] = players.map(player => {
      const playerTeamIds = picks
        .filter(p => p.player_id === player.id)
        .map(p => p.team_id);

      const totalPoints = points
        .filter(tp => playerTeamIds.includes(tp.team_id))
        .reduce((sum, tp) => sum + tp.points, 0);

      const teamsAlive = playerTeamIds.filter(
        tid => !isTeamEliminated(tid, points)
      ).length;

      const bestStage = getBestStage(playerTeamIds, points);

      return {
        ...player,
        total_points: totalPoints,
        teams_alive: teamsAlive,
        best_stage: bestStage,
      };
    });

    board.sort((a, b) => b.total_points - a.total_points || b.teams_alive - a.teams_alive);
    setLeaderboard(board);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('home-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_points' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, fetchData)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const allZero = leaderboard.every(p => p.total_points === 0);

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center pt-4 pb-6">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-palace-red mb-4 text-4xl shadow-lg">
          🦅
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight text-white">
          CPFC<span className="text-palace-red">Mundial</span>
        </h1>
        <p className="text-gold text-sm font-medium mt-1">Glad All Over the World</p>
        <p className="text-white/50 text-xs mt-1">World Cup 2026 Draft Game</p>
        {totalPicks > 0 && (
          <div className="mt-3 inline-flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1 text-xs text-white/70">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse inline-block" />
            {totalPicks}/48 picks made
          </div>
        )}
      </div>

      {/* Leaderboard */}
      <div>
        <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <span>🏆</span>
          <span>Leaderboard</span>
        </h2>

        {loading ? (
          <LoadingSkeleton />
        ) : leaderboard.length === 0 ? (
          <div className="card text-center py-8">
            <p className="text-white/60 text-sm">No players yet. Set up the game in Supabase!</p>
          </div>
        ) : (
          <>
            {allZero && totalPicks > 0 && (
              <div className="card text-center py-3 mb-3 border border-gold/20">
                <p className="text-white/70 text-sm">No points yet — draft is underway 🦅</p>
              </div>
            )}
            <div className="space-y-3">
              {leaderboard.map((player, idx) => (
                <PlayerCard key={player.id} player={player} rank={idx + 1} />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 pb-4">
        <Link href="/draft" className="card text-center py-4 hover:bg-white/20 transition-colors active:scale-95">
          <div className="text-2xl mb-1">📋</div>
          <div className="text-sm font-medium text-white">Draft Room</div>
        </Link>
        <Link href="/teams" className="card text-center py-4 hover:bg-white/20 transition-colors active:scale-95">
          <div className="text-2xl mb-1">⚽</div>
          <div className="text-sm font-medium text-white">Team Pool</div>
        </Link>
      </div>

      <ShareButton />
    </div>
  );
}

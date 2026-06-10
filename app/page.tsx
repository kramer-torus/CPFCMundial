'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { GameUser, DraftPick, TeamPoints, PlayerLeaderboard, STAGE_ORDER, KNOCKOUT_ROUNDS } from '@/lib/types';
import ShareButton from '@/components/ShareButton';

const RANK_BADGES = ['🥇', '🥈', '🥉'];

function calcLeaderboard(users: GameUser[], picks: DraftPick[], points: TeamPoints[]): PlayerLeaderboard[] {
  return users.map(u => {
    const myTeamIds = picks.filter(p => p.user_id === u.id).map(p => p.team_id);
    const totalPoints = points
      .filter(tp => myTeamIds.includes(tp.team_id))
      .reduce((sum, tp) => sum + tp.points, 0);
    const eliminatedIds = new Set(
      points
        .filter(tp => KNOCKOUT_ROUNDS.includes(tp.round) && tp.points === 0 && myTeamIds.includes(tp.team_id))
        .map(tp => tp.team_id)
    );
    const teamsAlive = myTeamIds.filter(id => !eliminatedIds.has(id)).length;
    let bestStage = '—';
    for (const round of [...STAGE_ORDER].reverse()) {
      if (points.some(tp => myTeamIds.includes(tp.team_id) && tp.round === round && tp.points > 0)) {
        bestStage = round;
        break;
      }
    }
    return { ...u, total_points: totalPoints, teams_alive: teamsAlive, best_stage: bestStage, points_delta: 0 };
  }).sort((a, b) => b.total_points - a.total_points);
}

export default function HomePage() {
  const router = useRouter();
  const [board, setBoard] = useState<PlayerLeaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPicks, setHasPicks] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes, picksRes, pointsRes] = await Promise.all([
        supabase.from('users').select('*').order('display_name'),
        supabase.from('draft_picks').select('*'),
        supabase.from('team_points').select('*'),
      ]);
      const users: GameUser[] = usersRes.data || [];
      const picks: DraftPick[] = picksRes.data || [];
      const points: TeamPoints[] = pointsRes.data || [];
      setHasPicks(picks.length > 0);
      setBoard(calcLeaderboard(users, picks, points));
      setUpdatedAt(new Date());
    } catch {
      // Network failure — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('leaderboard-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_points' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  return (
    <div className="page-fade">
      {/* Hero */}
      <div className="-mx-4 px-6 py-8 mb-6" style={{ background: 'linear-gradient(135deg, #C4122E 0%, #8B0D20 60%, #1F3864 100%)' }}>
        <div className="text-5xl mb-2">🦅</div>
        <h1 className="text-3xl font-extrabold text-white leading-tight">
          CPFC<span className="text-gold">Mundial</span>
        </h1>
        <p className="text-gold/90 italic text-sm mt-1">Glad All Over the World</p>
        <p className="text-white/60 text-xs mt-1">2026 FIFA World Cup Draft Game</p>
      </div>

      {/* Leaderboard */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold text-white text-lg">🏆 Leaderboard</h2>
        {updatedAt && (
          <span className="text-white/30 text-xs">
            Updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-20 bg-bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !hasPicks ? (
        <div className="card text-center py-12">
          <div className="text-5xl mb-3">🦅</div>
          <p className="text-white/60 text-sm">Draft hasn&apos;t started yet.</p>
          <button onClick={() => router.push('/draft')} className="btn-primary mt-4 text-sm">
            Head to the Draft Room →
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {board.map((player, idx) => (
            <div
              key={player.id}
              onClick={() => router.push(`/player/${player.id}`)}
              className="card cursor-pointer hover:bg-white/5 active:scale-[0.98] transition-all overflow-hidden"
              style={{ borderLeftColor: player.accent_colour, borderLeftWidth: 4 }}
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl w-8 text-center flex-shrink-0">
                  {idx < 3 ? RANK_BADGES[idx] : <span className="text-white/30 font-bold text-lg">{idx + 1}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-lg leading-tight">{player.display_name}</div>
                  <div className="text-white/40 text-xs mt-0.5">
                    {player.teams_alive} teams alive · Best: {player.best_stage}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className="text-2xl font-extrabold text-gold">{player.total_points}</div>
                  <div className="text-white/40 text-xs">pts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ShareButton />
    </div>
  );
}

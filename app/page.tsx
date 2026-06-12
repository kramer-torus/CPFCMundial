'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { GameUser, DraftPick, TeamPoints, PlayerLeaderboard, STAGE_ORDER, KNOCKOUT_ROUNDS } from '@/lib/types';
import ShareButton from '@/components/ShareButton';
import FixtureTicker from '@/components/FixtureTicker';

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

  useEffect(() => {
    if (!getSession()) router.replace('/login');
  }, [router]);

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
      <div className="-mx-4 px-6 py-8" style={{ background: 'linear-gradient(160deg, #2a0a12 0%, #C4122E 35%, #8B0D20 65%, #1F3864 100%)' }}>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-5xl text-white leading-none tracking-wide">
              CPFC<span className="text-gold">MUNDIAL</span>
            </h1>
            <p className="text-gold/80 italic text-sm mt-1.5">Glad All Over the World</p>
            <p className="text-white/50 text-xs mt-0.5 uppercase tracking-widest">2026 World Cup Draft</p>
          </div>
          <div className="text-5xl opacity-80">🦅</div>
        </div>
      </div>

      {/* Upcoming fixture ticker for drafted teams */}
      <FixtureTicker />

      {/* Leaderboard header */}
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-display font-bold text-xl text-white tracking-wider uppercase">Standings</h2>
        {updatedAt && (
          <span className="text-white/25 text-xs tabular-nums">
            {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-[72px] bg-bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !hasPicks ? (
        <div className="card text-center py-12 space-y-4">
          <div className="text-5xl">🦅</div>
          <div>
            <p className="font-display font-bold text-2xl text-white tracking-wide">DRAFT NOT STARTED</p>
            <p className="text-white/40 text-sm mt-1">Complete The Gauntlet first to set draft order</p>
          </div>
          <button onClick={() => router.push('/draft')} className="btn-primary">
            Go to Draft Room →
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {board.map((player, idx) => (
            <div
              key={player.id}
              onClick={() => router.push(`/player/${player.id}`)}
              className="relative overflow-hidden rounded-xl cursor-pointer active:scale-[0.98] transition-all"
              style={{ background: `linear-gradient(90deg, ${player.accent_colour}18 0%, transparent 60%)`, borderWidth: 1, borderColor: `${player.accent_colour}30` }}
            >
              {/* Left accent bar */}
              <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-xl" style={{ backgroundColor: player.accent_colour }} />

              <div className="flex items-center gap-3 pl-4 pr-3 py-3">
                {/* Rank */}
                <div className="w-9 flex-shrink-0 text-center">
                  {idx < 3
                    ? <span className="text-2xl leading-none">{RANK_BADGES[idx]}</span>
                    : <span className="font-display font-bold text-2xl text-white/25 leading-none">{idx + 1}</span>
                  }
                </div>
                {/* Name + meta */}
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-white text-base leading-tight">{player.display_name}</div>
                  <div className="text-white/35 text-xs mt-0.5 tabular-nums">
                    {player.teams_alive} alive · {player.best_stage !== '—' ? player.best_stage : 'not started'}
                  </div>
                </div>
                {/* Score */}
                <div className="text-right flex-shrink-0">
                  <div className="font-display font-bold text-3xl text-gold leading-none tabular-nums">{player.total_points}</div>
                  <div className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">pts</div>
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

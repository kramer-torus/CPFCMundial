'use client';
import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Player, Team, DraftPick, TeamPoints, TIER_COLORS } from '@/lib/types';

interface TeamWithPoints extends Team {
  points: number;
  pointsByRound: Record<string, number>;
}

export default function PlayerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const playerId = params.id as string;

  const [player, setPlayer] = useState<Player | null>(null);
  const [teams, setTeams] = useState<TeamWithPoints[]>([]);
  const [totalPoints, setTotalPoints] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    const [playerRes, picksRes, teamsRes, pointsRes] = await Promise.all([
      supabase.from('players').select('*').eq('id', playerId).single(),
      supabase.from('draft_picks').select('*').eq('player_id', playerId).order('pick_number'),
      supabase.from('teams').select('*'),
      supabase.from('team_points').select('*'),
    ]);

    const playerData: Player | null = playerRes.data;
    const picks: DraftPick[] = picksRes.data || [];
    const allTeams: Team[] = teamsRes.data || [];
    const allPoints: TeamPoints[] = pointsRes.data || [];

    setPlayer(playerData);

    const playerTeamIds = picks.map(p => p.team_id);
    const playerTeams: TeamWithPoints[] = playerTeamIds
      .map(tid => {
        const team = allTeams.find(t => t.id === tid);
        if (!team) return null;
        const teamPts = allPoints.filter(tp => tp.team_id === tid);
        const points = teamPts.reduce((sum, tp) => sum + tp.points, 0);
        const pointsByRound: Record<string, number> = {};
        teamPts.forEach(tp => { pointsByRound[tp.round] = tp.points; });
        return { ...team, points, pointsByRound };
      })
      .filter(Boolean) as TeamWithPoints[];

    playerTeams.sort((a, b) => a.tier - b.tier || a.name.localeCompare(b.name));
    setTeams(playerTeams);
    setTotalPoints(playerTeams.reduce((sum, t) => sum + t.points, 0));
    setLoading(false);
  }, [playerId]);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel(`player-${playerId}-realtime`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_points' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData, playerId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-24 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-24 bg-white/10 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-36 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60">Player not found</p>
        <button onClick={() => router.push('/')} className="btn-primary mt-4">
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {/* Back button */}
      <button
        onClick={() => router.back()}
        className="text-white/60 hover:text-white transition-colors text-sm flex items-center gap-1"
      >
        <span>←</span> Back
      </button>

      {/* Player header */}
      <div
        className="card border-2"
        style={{ borderColor: player.color_hex }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-white">{player.name}</h1>
            <p className="text-white/50 text-sm mt-0.5">{teams.length} teams drafted</p>
          </div>
          <div className="text-right">
            <div
              className="text-4xl font-extrabold"
              style={{ color: player.color_hex }}
            >
              {totalPoints}
            </div>
            <div className="text-xs text-white/50">total pts</div>
          </div>
        </div>
      </div>

      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-white/60 text-sm">No teams drafted yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {teams.map(team => {
            const tc = TIER_COLORS[team.tier];
            const knockoutRounds = ['R32', 'R16', 'QF', 'SF', '3PO', 'FINAL'];
            const isEliminated = knockoutRounds.some(
              r => team.pointsByRound[r] === 0
            );
            return (
              <div
                key={team.id}
                className={`card flex flex-col items-center text-center p-4 ${isEliminated ? 'opacity-50' : ''}`}
              >
                <div className="text-4xl mb-2">{team.flag_emoji}</div>
                <div className="font-bold text-white text-sm leading-tight mb-1">
                  {team.name}
                </div>
                <div className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.bg} ${tc.text} mb-2`}>
                  T{team.tier}
                </div>
                {isEliminated && (
                  <div className="text-xs text-white/40 mb-1">Eliminated</div>
                )}
                <div className="mt-auto">
                  <span className="text-xl font-extrabold text-gold">{team.points}</span>
                  <span className="text-xs text-white/50 ml-1">pts</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

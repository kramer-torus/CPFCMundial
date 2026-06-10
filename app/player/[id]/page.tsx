'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GameUser, Team, DraftPick, TeamPoints, TIER_COLORS, KNOCKOUT_ROUNDS } from '@/lib/types';

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<GameUser | null>(null);
  const [teams, setTeams] = useState<(Team & { points: number; eliminated: boolean })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [userRes, picksRes, pointsRes] = await Promise.all([
        supabase.from('users').select('*').eq('id', id).single(),
        supabase.from('draft_picks').select('*, teams(*)').eq('user_id', id).order('pick_number'),
        supabase.from('team_points').select('*'),
      ]);
      const u = userRes.data as GameUser;
      const picks: (DraftPick & { teams: Team })[] = picksRes.data || [];
      const allPoints: TeamPoints[] = pointsRes.data || [];
      setUser(u);
      const enriched = picks.map(p => {
        const teamId = p.team_id;
        const pts = allPoints.filter(tp => tp.team_id === teamId).reduce((s, tp) => s + tp.points, 0);
        const elim = allPoints.some(tp => tp.team_id === teamId && KNOCKOUT_ROUNDS.includes(tp.round) && tp.points === 0);
        return { ...p.teams, points: pts, eliminated: elim };
      });
      setTeams(enriched);
      setLoading(false);
    }
    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-60">
      <div className="w-8 h-8 border-2 border-palace-red border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!user) return <div className="card text-center py-8 text-white/50">Player not found.</div>;

  const totalPts = teams.reduce((s, t) => s + t.points, 0);
  const alive = teams.filter(t => !t.eliminated).length;

  return (
    <div className="page-fade space-y-4 pb-4">
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-white/40 hover:text-white text-sm transition-colors">
        <ArrowLeft size={16} /> Back
      </button>
      {/* Header */}
      <div className="card overflow-hidden" style={{ borderLeftColor: user.accent_colour, borderLeftWidth: 4 }}>
        <div className="font-extrabold text-2xl text-white">{user.display_name}</div>
        <div className="flex items-center gap-4 mt-2">
          <div>
            <span className="text-3xl font-extrabold text-gold">{totalPts}</span>
            <span className="text-white/40 text-sm ml-1">pts</span>
          </div>
          <div className="text-white/50 text-sm">{alive}/{teams.length} teams alive</div>
        </div>
      </div>
      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-white/50 text-sm">No teams drafted yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {teams.map(team => {
            const tc = TIER_COLORS[team.tier];
            return (
              <div
                key={team.id}
                className={`card flex flex-col items-center gap-2 py-4 transition-opacity ${team.eliminated ? 'opacity-40' : ''}`}
              >
                <span className="text-4xl">{team.flag_emoji}</span>
                <span className="font-bold text-white text-sm text-center leading-tight">{team.name}</span>
                <span className={`pill ${tc.bg} ${tc.text} text-[10px]`}>T{team.tier} {tc.label}</span>
                <span className={`font-bold text-lg ${team.points > 0 ? 'text-gold' : 'text-white/30'}`}>{team.points} pts</span>
                {team.eliminated && <span className="text-rose-400 text-xs font-semibold">Eliminated</span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

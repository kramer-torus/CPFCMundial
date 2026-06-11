'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { GameUser, DraftPick, TeamPoints, Team, KNOCKOUT_ROUNDS, TIER_COLORS } from '@/lib/types';

const RANK_BADGES = ['🥇','🥈','🥉'];

interface PlayerSquad {
  user: GameUser; totalPoints: number; teamsAlive: number;
  picks: (DraftPick & { team: Team; points: number; eliminated: boolean })[]; rank: number;
}

function buildSquads(users: GameUser[], picks: DraftPick[], teams: Team[], pointsData: TeamPoints[]): PlayerSquad[] {
  const teamsById = new Map(teams.map(t => [t.id, t]));
  const squads: Omit<PlayerSquad,'rank'>[] = users.map(user => {
    const userPicks = picks.filter(p => p.user_id === user.id);
    const teamIds = userPicks.map(p => p.team_id);
    const eliminatedIds = new Set(pointsData.filter(tp => KNOCKOUT_ROUNDS.includes(tp.round) && tp.points === 0 && teamIds.includes(tp.team_id)).map(tp => tp.team_id));
    const totalPoints = pointsData.filter(tp => teamIds.includes(tp.team_id)).reduce((sum,tp) => sum+tp.points, 0);
    const teamsAlive = teamIds.filter(id => !eliminatedIds.has(id)).length;
    const enrichedPicks = userPicks.map(pick => {
      const team = teamsById.get(pick.team_id);
      const pts = pointsData.filter(tp => tp.team_id === pick.team_id).reduce((sum,tp) => sum+tp.points, 0);
      return { ...pick, team: team!, points: pts, eliminated: eliminatedIds.has(pick.team_id) };
    }).filter(p => p.team != null);
    enrichedPicks.sort((a,b) => a.eliminated!==b.eliminated ? (a.eliminated?1:-1) : b.points-a.points);
    return { user, totalPoints, teamsAlive, picks: enrichedPicks };
  });
  squads.sort((a,b) => b.totalPoints-a.totalPoints);
  return squads.map((s,i) => ({ ...s, rank: i+1 }));
}

export default function SquadsPage() {
  const router = useRouter();
  const [squads, setSquads] = useState<PlayerSquad[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasPicks, setHasPicks] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [usersRes,picksRes,teamsRes,pointsRes] = await Promise.all([
        supabase.from('users').select('*').order('display_name'),
        supabase.from('draft_picks').select('*'),
        supabase.from('teams').select('*'),
        supabase.from('team_points').select('*'),
      ]);
      const users: GameUser[] = usersRes.data??[]; const picks: DraftPick[] = picksRes.data??[];
      const teams: Team[] = teamsRes.data??[]; const pointsData: TeamPoints[] = pointsRes.data??[];
      setHasPicks(picks.length>0); setSquads(buildSquads(users,picks,teams,pointsData));
    } catch {} finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('squads-rt')
      .on('postgres_changes',{event:'*',schema:'public',table:'team_points'},fetchData)
      .on('postgres_changes',{event:'*',schema:'public',table:'draft_picks'},fetchData).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  return (
    <div className="page-fade">
      <div className="-mx-4 px-6 py-8 mb-5" style={{background:'linear-gradient(160deg,#0a1f0a 0%,#1a3a1a 30%,#0F1923 70%,#1F3864 100%)'}}>
        <h1 className="font-display font-bold text-5xl text-white leading-none tracking-wide">SQUADS</h1>
        <p className="text-white/50 text-sm mt-1.5 uppercase tracking-widest">2026 World Cup Draft</p>
      </div>
      {loading ? (
        <div className="space-y-4">{[...Array(3)].map((_,i)=><div key={i} className="h-40 bg-bg-card rounded-xl animate-pulse" />)}</div>
      ) : !hasPicks ? (
        <div className="card text-center py-12 space-y-4">
          <div className="text-5xl">🦅</div>
          <div><p className="font-display font-bold text-2xl text-white tracking-wide">DRAFT NOT STARTED</p><p className="text-white/40 text-sm mt-1">Complete The Gauntlet first to set draft order</p></div>
          <button onClick={()=>router.push('/draft')} className="btn-primary">Go to Draft Room →</button>
        </div>
      ) : (
        <div className="space-y-5">
          {squads.map(squad=>(
            <div key={squad.user.id} className="relative overflow-hidden rounded-xl border" style={{borderColor:squad.user.accent_colour+'30',background:`linear-gradient(180deg,${squad.user.accent_colour}08 0%,#1A2535 40%)`}}>
              <div className="absolute top-3 left-3 z-10">
                {squad.rank<=3?<span className="text-2xl leading-none">{RANK_BADGES[squad.rank-1]}</span>:<span className="font-display font-bold text-lg leading-none" style={{color:squad.user.accent_colour}}>{squad.rank}</span>}
              </div>
              <div className="pt-3 px-4 pb-3 pl-10 flex items-center justify-between">
                <div>
                  <h2 className="font-display font-bold text-2xl leading-none tracking-wide" style={{color:squad.user.accent_colour}}>{squad.user.display_name.toUpperCase()}</h2>
                  <p className="text-white/35 text-xs mt-1 tabular-nums">{squad.teamsAlive}/8 teams alive</p>
                </div>
                <div className="text-right">
                  <div className="font-display font-bold text-3xl text-gold leading-none tabular-nums">{squad.totalPoints}</div>
                  <div className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">pts</div>
                </div>
              </div>
              <div className="h-[2px] mx-4 mb-3 rounded-full" style={{background:`linear-gradient(90deg,${squad.user.accent_colour},transparent)`}} />
              <div className="grid grid-cols-2 gap-2 px-3 pb-3">
                {squad.picks.map(pick=>{
                  if(!pick.team) return null;
                  const tc=TIER_COLORS[pick.team.tier];
                  return (
                    <div key={pick.id} className={`rounded-xl border border-white/8 p-2.5 flex items-center gap-2.5 ${pick.eliminated?'opacity-40':''}`} style={{background:'#0F1923'}}>
                      <span className="text-3xl leading-none flex-shrink-0">{pick.team.flag_emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-white text-xs font-semibold truncate leading-tight">{pick.team.name}</span>
                          {pick.eliminated&&<span className="text-white/40 text-[10px] font-bold">Out</span>}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className={`pill text-[10px] py-0 px-1.5 ${tc.bg} ${tc.text} ${tc.border} border`}>T{pick.team.tier}</span>
                          <span className={`font-display font-bold text-sm tabular-nums ${pick.points>0?'text-gold':'text-white/25'}`}>{pick.points}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

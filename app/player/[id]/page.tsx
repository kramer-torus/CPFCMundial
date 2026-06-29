'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { GameUser, Team, DraftPick, TeamPoints } from '@/lib/types';
import { computeEliminatedTeamIds, knockoutQualifiers } from '@/lib/elimination';
import type { FixtureMatch } from '@/app/api/fixtures/route';

const TEAM_NAME_MAP: Record<string, string> = {
  'IR Iran': 'Iran', 'Korea Republic': 'South Korea',
  "Côte d'Ivoire": 'Ivory Coast', "Cote d'Ivoire": 'Ivory Coast',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina', 'Czech Republic': 'Czechia',
  'Cape Verde Islands': 'Cape Verde', 'Curaçao': 'Curacao',
  'Congo DR': 'DR Congo', 'Democratic Republic of Congo': 'DR Congo',
};

function normName(n: string) { return (TEAM_NAME_MAP[n] ?? n).toLowerCase(); }

function getNextFixture(teamName: string, fixtures: FixtureMatch[]): FixtureMatch | null {
  const key = teamName.toLowerCase();
  return fixtures
    .filter(m => ['SCHEDULED','TIMED','IN_PLAY'].includes(m.status))
    .filter(m => normName(m.homeTeam) === key || normName(m.awayTeam) === key)
    .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())[0] ?? null;
}

function fmtNext(utcDate: string): string {
  const d = new Date(utcDate);
  const now = new Date();
  const tom = new Date(now); tom.setDate(tom.getDate() + 1);
  const day = d.toDateString() === now.toDateString() ? 'Today'
    : d.toDateString() === tom.toDateString() ? 'Tomorrow'
    : d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  return `${day} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
}

export default function PlayerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<GameUser | null>(null);
  const [teams, setTeams] = useState<(Team & { points: number; eliminated: boolean })[]>([]);
  const [loading, setLoading] = useState(true);
  const [fixtures, setFixtures] = useState<FixtureMatch[]>([]);
  const [allPoints, setAllPoints] = useState<TeamPoints[]>([]);

  useEffect(() => {
    async function fetchData() {
      try {
        const [userRes, picksRes, pointsRes, teamsRes, fixturesJson] = await Promise.all([
          supabase.from('users').select('*').eq('id', id).single(),
          supabase.from('draft_picks').select('*, teams(*)').eq('user_id', id).order('pick_number'),
          supabase.from('team_points').select('*'),
          supabase.from('teams').select('*'),
          fetch('/api/fixtures').then(r=>r.json()).catch(()=>({matches:[]})),
        ]);
        const u = userRes.data as GameUser;
        const picks: (DraftPick & { teams: Team })[] = picksRes.data || [];
        const ap: TeamPoints[] = pointsRes.data || [];
        const allTeams: Team[] = teamsRes.data || [];
        const fx: FixtureMatch[] = fixturesJson.matches ?? [];
        const eliminatedIds = computeEliminatedTeamIds(allTeams, ap, knockoutQualifiers(fx, allTeams));
        setUser(u);
        setAllPoints(ap);
        setFixtures(fx);
        setTeams(picks.map(p => {
          const teamId = p.team_id;
          const pts = ap.filter(tp => tp.team_id === teamId).reduce((s, tp) => s + tp.points, 0);
          return { ...p.teams, points: pts, eliminated: eliminatedIds.has(teamId) };
        }));
      } catch {
        // Network failure
      } finally {
        setLoading(false);
      }
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
      <div className="rounded-xl overflow-hidden relative" style={{ background: `linear-gradient(135deg, ${user.accent_colour}22 0%, ${user.accent_colour}08 100%)`, border: `1px solid ${user.accent_colour}30` }}>
        <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: user.accent_colour }} />
        <div className="pl-5 pr-4 py-4">
          <div className="font-display font-bold text-4xl text-white leading-none tracking-wide uppercase">{user.display_name}</div>
          <div className="flex items-end gap-4 mt-3">
            <div>
              <div className="font-display font-bold text-5xl text-gold leading-none tabular-nums">{totalPts}</div>
              <div className="text-white/30 text-[10px] uppercase tracking-wider mt-0.5">points</div>
            </div>
            <div className="pb-1 text-right">
              <div className="font-bold text-white/80 text-lg tabular-nums">{alive}/{teams.length}</div>
              <div className="text-white/30 text-[10px] uppercase tracking-wider">teams alive</div>
            </div>
          </div>
        </div>
      </div>
      {/* Teams grid */}
      {teams.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-white/50 text-sm">No teams drafted yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map(team => {
            let gp=0,w=0,d=0,l=0;
            for (const r of ['GW1','GW2','GW3']) {
              const row = allPoints.find(tp => tp.team_id === team.id && tp.round === r);
              if (!row) continue; gp++;
              if (row.points===3) w++; else if (row.points===1) d++; else l++;
            }
            const next = getNextFixture(team.name, fixtures);
            const oppApiName = next ? (normName(next.homeTeam)===team.name.toLowerCase() ? next.awayTeam : next.homeTeam) : null;
            const oppCanon = oppApiName ? (TEAM_NAME_MAP[oppApiName] ?? oppApiName) : null;
            return (
              <div
                key={team.id}
                className={`card flex items-start justify-between gap-3 py-3 transition-opacity ${team.eliminated ? 'opacity-40' : ''}`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className="text-3xl leading-none flex-shrink-0">{team.flag_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-sm leading-tight">{team.name}</div>
                    <div className="text-white/35 text-[11px] mt-0.5">
                      {team.fifa_group ? `Group ${team.fifa_group.replace(/^GROUP_/,'')}` : ''}
                      {gp > 0 ? ` · ${gp}p · ${w}W ${d}D ${l}L` : ' · Yet to play'}
                    </div>
                    {next && !team.eliminated && oppCanon && (
                      <div className="text-white/30 text-[10px] mt-0.5">
                        Next: vs {oppCanon} · {fmtNext(next.utcDate)}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                  {team.eliminated ? (
                    <span className="inline-flex items-center bg-rose-500/10 border border-rose-500/25 text-rose-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Eliminated</span>
                  ) : (
                    <span className="inline-flex items-center bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">Still In It</span>
                  )}
                  <span className={`font-display font-bold text-lg tabular-nums ${team.points > 0 ? 'text-gold' : 'text-white/30'}`}>{team.points}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

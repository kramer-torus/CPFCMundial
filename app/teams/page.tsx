'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Team, Player, DraftPick, TIER_COLORS } from '@/lib/types';

interface TeamWithDrafter extends Team {
  drafter: Player | null;
}

type TierFilter = 'all' | 1 | 2 | 3 | 4;

export default function TeamsPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamWithDrafter[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');

  const fetchData = useCallback(async () => {
    const [teamsRes, picksRes, playersRes] = await Promise.all([
      supabase.from('teams').select('*').order('tier').order('name'),
      supabase.from('draft_picks').select('*'),
      supabase.from('players').select('*'),
    ]);

    const allTeams: Team[] = teamsRes.data || [];
    const picks: DraftPick[] = picksRes.data || [];
    const players: Player[] = playersRes.data || [];

    const teamsWithDrafter: TeamWithDrafter[] = allTeams.map(team => {
      const pick = picks.find(p => p.team_id === team.id);
      const drafter = pick ? (players.find(p => p.id === pick.player_id) || null) : null;
      return { ...team, drafter };
    });

    setTeams(teamsWithDrafter);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('teams-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  const filtered = teams.filter(team => {
    const matchesSearch =
      team.name.toLowerCase().includes(search.toLowerCase()) ||
      team.confederation.toLowerCase().includes(search.toLowerCase());
    const matchesTier = tierFilter === 'all' || team.tier === tierFilter;
    return matchesSearch && matchesTier;
  });

  const availableCount = teams.filter(t => !t.drafter).length;
  const draftedCount = teams.filter(t => t.drafter).length;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Team Pool ⚽</h1>
        <div className="text-xs text-white/40">
          {draftedCount}/{teams.length} drafted
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3">
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-gold">{draftedCount}</div>
          <div className="text-xs text-white/50">Drafted</div>
        </div>
        <div className="card text-center py-3">
          <div className="text-2xl font-bold text-emerald-400">{availableCount}</div>
          <div className="text-xs text-white/50">Available</div>
        </div>
      </div>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search teams or confederation..."
        className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white placeholder-white/30 focus:outline-none focus:border-gold text-sm"
      />

      {/* Tier filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 1, 2, 3, 4] as TierFilter[]).map(t => (
          <button
            key={String(t)}
            onClick={() => setTierFilter(t)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
              tierFilter === t
                ? 'bg-palace-red text-white'
                : 'bg-white/10 text-white/60 hover:bg-white/20'
            }`}
          >
            {t === 'all' ? 'All' : `T${t} – ${TIER_COLORS[t as number].label.split(' · ')[1]}`}
          </button>
        ))}
      </div>

      {/* Teams list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-8">
          <p className="text-white/60 text-sm">No teams found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(team => {
            const tc = TIER_COLORS[team.tier];
            return (
              <div
                key={team.id}
                onClick={() => team.drafter && router.push(`/player/${team.drafter.id}`)}
                className={`card flex items-center gap-3 p-3 ${team.drafter ? 'cursor-pointer hover:bg-white/20 transition-colors' : ''}`}
              >
                <span className="text-2xl">{team.flag_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm leading-tight">{team.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${tc.bg} ${tc.text}`}>T{team.tier}</span>
                    <span className="text-xs text-white/40">{team.confederation}</span>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  {team.drafter ? (
                    <div
                      className="text-xs font-semibold px-2 py-1 rounded-lg"
                      style={{
                        color: team.drafter.color_hex,
                        backgroundColor: `${team.drafter.color_hex}20`,
                      }}
                    >
                      {team.drafter.name}
                    </div>
                  ) : (
                    <div className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-lg">
                      Available
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

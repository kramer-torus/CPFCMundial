'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Team, DraftPick, Player, TIER_COLORS } from '@/lib/types';

type TierFilter = 'all' | 1 | 2 | 3 | 4;

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: t }, { data: dp }, { data: pl }] = await Promise.all([
        supabase.from('teams').select('*').order('tier').order('name'),
        supabase.from('draft_picks').select('*'),
        supabase.from('players').select('*'),
      ]);
      if (t) setTeams(t);
      if (dp) setPicks(dp);
      if (pl) setPlayers(pl);
      setLoading(false);
    }
    load();
  }, []);

  const playerMap = Object.fromEntries(players.map(p => [p.id, p]));
  const pickMap = Object.fromEntries(picks.map(p => [p.team_id, p]));

  const filtered = teams.filter(t => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'all' || t.tier === tierFilter;
    return matchSearch && matchTier;
  });

  const TIER_LABELS: Record<number, string> = {
    1: 'T1 · Elite',
    2: 'T2 · Contenders',
    3: 'T3 · Dark Horses',
    4: 'T4 · Underdogs',
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-black text-gold">Team Pool ⚽</h1>

      {/* Search */}
      <input
        type="text"
        value={search}
        onChange={e => setSearch(e.target.value)}
        placeholder="Search teams..."
        className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-gold"
      />

      {/* Tier filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 1, 2, 3, 4] as TierFilter[]).map(t => (
          <button
            key={t}
            onClick={() => setTierFilter(t)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
              tierFilter === t
                ? 'bg-palace-red text-white'
                : 'bg-white/10 text-white/70 hover:bg-white/20'
            }`}
          >
            {t === 'all' ? 'All Tiers' : `T${t}`}
          </button>
        ))}
      </div>

      <p className="text-white/50 text-sm">{filtered.length} teams</p>

      {loading ? (
        <div className="space-y-2">
          {[...Array(12)].map((_, i) => (
            <div key={i} className="card h-14 animate-pulse bg-white/5" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(team => {
            const pick = pickMap[team.id];
            const drafter = pick ? playerMap[pick.player_id] : null;
            const tierInfo = TIER_COLORS[team.tier];

            const row = (
              <div
                key={team.id}
                className="card flex items-center gap-3 py-3"
              >
                <span className="text-2xl">{team.flag_emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold leading-tight truncate">{team.name}</p>
                  <p className="text-white/50 text-xs">{team.confederation}</p>
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tierInfo.bg} ${tierInfo.text}`}>
                  T{team.tier}
                </span>
                {drafter ? (
                  <span
                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: drafter.color_hex + '33', color: drafter.color_hex }}
                  >
                    {drafter.name}
                  </span>
                ) : (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-400">
                    Available
                  </span>
                )}
              </div>
            );

            return drafter ? (
              <Link key={team.id} href={`/player/${drafter.id}`} className="block hover:opacity-80 active:scale-[0.99] transition-all">
                {row}
              </Link>
            ) : (
              <div key={team.id}>{row}</div>
            );
          })}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="text-center text-white/50 py-8">No teams match your search.</div>
      )}

      {/* Tier legend */}
      <div className="card space-y-1 mt-4">
        <p className="text-gold text-xs font-bold mb-2">Tier Guide</p>
        {([1, 2, 3, 4] as const).map(t => (
          <div key={t} className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full ${TIER_COLORS[t].bg}`} />
            <span className="text-xs text-white/70">{TIER_LABELS[t]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

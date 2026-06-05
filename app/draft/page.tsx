'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Player, Team, DraftPick, TIER_COLORS } from '@/lib/types';
import { getDraftSnakeOrder, getTierForPickNumber } from '@/lib/draft-utils';
import AdminPinModal from '@/components/AdminPinModal';

interface TeamWithDrafter extends Team {
  drafter?: Player;
  pickNumber?: number;
}

export default function DraftPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState<string | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [openTiers, setOpenTiers] = useState<Set<number>>(new Set([1]));
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    const [playersRes, teamsRes, picksRes] = await Promise.all([
      supabase.from('players').select('*').order('created_at', { ascending: true }),
      supabase.from('teams').select('*').order('tier').order('name'),
      supabase.from('draft_picks').select('*').order('pick_number'),
    ]);
    setPlayers(playersRes.data || []);
    setTeams(teamsRes.data || []);
    setPicks(picksRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const channel = supabase
      .channel('draft-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchData]);

  // Derived state
  const currentPickNumber = picks.length + 1;
  const isDraftComplete = picks.length >= 48;
  const currentTier = isDraftComplete ? 4 : getTierForPickNumber(currentPickNumber);

  // Open current tier by default when tier changes
  useEffect(() => {
    if (!isDraftComplete) {
      setOpenTiers(new Set([currentTier]));
    }
  }, [currentTier, isDraftComplete]);

  const snakeOrder = players.length > 0 ? getDraftSnakeOrder(players.map(p => p.id)) : [];
  const currentPlayerId = !isDraftComplete ? snakeOrder[currentPickNumber - 1] : null;
  const currentPlayer = players.find(p => p.id === currentPlayerId);

  // Build team → drafter map
  const draftedMap: Record<string, { player: Player; pickNumber: number }> = {};
  for (const pick of picks) {
    const player = players.find(p => p.id === pick.player_id);
    if (player) {
      draftedMap[pick.team_id] = { player, pickNumber: pick.pick_number };
    }
  }

  async function handlePickTeam(team: Team) {
    if (draftedMap[team.id] || !currentPlayer || isDraftComplete) return;
    setPicking(team.id);
    setError(null);
    const { error: err } = await supabase.from('draft_picks').insert({
      player_id: currentPlayer.id,
      team_id: team.id,
      pick_number: currentPickNumber,
    });
    if (err) setError(err.message);
    setPicking(null);
  }

  async function handleResetDraft() {
    const { error: err } = await supabase.from('draft_picks').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (err) setError(err.message);
    else await fetchData();
  }

  function toggleTier(tier: number) {
    setOpenTiers(prev => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-white/10 rounded-xl animate-pulse" />
        <div className="h-24 bg-white/10 rounded-2xl animate-pulse" />
        <div className="space-y-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-14 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-4">
      {showAdminModal && (
        <AdminPinModal
          onSuccess={() => { setShowAdminModal(false); handleResetDraft(); }}
          onCancel={() => setShowAdminModal(false)}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Draft Room 📋</h1>
        <button
          onClick={() => setShowAdminModal(true)}
          className="text-xs text-white/40 hover:text-white/70 transition-colors px-2 py-1"
        >
          Reset
        </button>
      </div>

      {error && (
        <div className="bg-palace-red/20 border border-palace-red/40 rounded-xl p-3 text-sm text-white">
          {error}
        </div>
      )}

      {/* Draft Complete */}
      {isDraftComplete ? (
        <div className="card text-center py-8 border border-gold/30">
          <div className="text-4xl mb-3">🎉</div>
          <h2 className="text-xl font-bold text-gold mb-1">Draft Complete!</h2>
          <p className="text-white/60 text-sm">All 48 teams have been picked. Good luck!</p>
        </div>
      ) : (
        <>
          {/* Current pick banner */}
          <div
            className="card py-4 text-center border-2"
            style={{
              borderColor: currentPlayer?.color_hex || '#C9A84C',
              background: `${currentPlayer?.color_hex}18`,
            }}
          >
            <div className="text-xs text-white/50 mb-1">Pick #{currentPickNumber} of 48</div>
            <div className="text-xl font-bold text-white">
              {currentPlayer
                ? <>It&apos;s <span style={{ color: currentPlayer.color_hex }}>{currentPlayer.name}&apos;s</span> turn</>
                : 'Waiting for players...'}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TIER_COLORS[currentTier].bg} ${TIER_COLORS[currentTier].text}`}>
                {TIER_COLORS[currentTier].label}
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-palace-red transition-all duration-500"
              style={{ width: `${(picks.length / 48) * 100}%` }}
            />
          </div>
          <div className="text-xs text-center text-white/40">{picks.length} of 48 picks made</div>
        </>
      )}

      {/* Teams by tier */}
      {([1, 2, 3, 4] as const).map(tier => {
        const tierTeams = teams.filter(t => t.tier === tier);
        const isOpen = openTiers.has(tier);
        const tierDrafted = tierTeams.filter(t => draftedMap[t.id]).length;
        const tc = TIER_COLORS[tier];

        return (
          <div key={tier} className="card p-0 overflow-hidden">
            <button
              onClick={() => toggleTier(tier)}
              className="w-full flex items-center justify-between p-4 text-left"
            >
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tc.bg} ${tc.text}`}>
                  T{tier}
                </span>
                <span className="font-semibold text-white">{tc.label.split(' · ')[1]}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/40">{tierDrafted}/{tierTeams.length}</span>
                <span className="text-white/40 text-sm">{isOpen ? '▲' : '▼'}</span>
              </div>
            </button>

            {isOpen && (
              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                {tierTeams.map(team => {
                  const drafted = draftedMap[team.id];
                  const isPickingThis = picking === team.id;
                  return (
                    <button
                      key={team.id}
                      onClick={() => !drafted && handlePickTeam(team)}
                      disabled={!!drafted || isPickingThis || isDraftComplete}
                      className={`relative rounded-xl p-3 text-left transition-all border ${
                        drafted
                          ? 'opacity-40 bg-white/5 border-white/10 cursor-default'
                          : 'bg-white/10 border-white/20 hover:bg-white/20 hover:border-gold/50 active:scale-95 cursor-pointer'
                      } ${isPickingThis ? 'opacity-60 animate-pulse' : ''}`}
                    >
                      <div className="text-2xl mb-1">{team.flag_emoji}</div>
                      <div className="text-sm font-semibold text-white leading-tight">{team.name}</div>
                      {drafted && (
                        <div
                          className="text-xs mt-1 font-medium truncate"
                          style={{ color: drafted.player.color_hex }}
                        >
                          {drafted.player.name}
                        </div>
                      )}
                      {!drafted && !isDraftComplete && (
                        <div className="text-xs text-white/30 mt-1">{team.confederation}</div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

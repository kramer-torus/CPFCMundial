'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { ChevronDown, ChevronUp, RotateCcw, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import AuthGuard from '@/components/AuthGuard';
import ConfirmSheet from '@/components/ConfirmSheet';
import { GameUser, Team, DraftPick, TIER_COLORS } from '@/lib/types';
import { getPlayerIndexForPick, getTierForPickNumber, getSnakeDirection } from '@/lib/draft-utils';

const PLAYER_ORDER = ['Kev', 'Franks', 'Kangars', 'Jakob', 'Matty Eagles', 'Liam'];

export default function DraftPage() {
  return <AuthGuard><DraftRoom /></AuthGuard>;
}

function DraftRoom() {
  const session = getSession();
  const [users, setUsers] = useState<GameUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [loading, setLoading] = useState(true);
  const [openTiers, setOpenTiers] = useState<Set<number>>(new Set([1]));
  const [confirm, setConfirm] = useState<{ team: Team } | null>(null);
  const [undoConfirm, setUndoConfirm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tierFilter, setTierFilter] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    const [usersRes, teamsRes, picksRes] = await Promise.all([
      supabase.from('users').select('*').order('created_at'),
      supabase.from('teams').select('*').order('tier').order('name'),
      supabase.from('draft_picks').select('*').order('pick_number'),
    ]);
    // Sort by draft_position if set (from quiz), otherwise fall back to hardcoded order
    const rawUsers: GameUser[] = usersRes.data || [];
    const sortedUsers = (() => {
      const allHavePosition = rawUsers.length > 0 && rawUsers.every(u => u.draft_position !== null);
      if (allHavePosition) {
        return [...rawUsers].sort((a, b) => (a.draft_position ?? 99) - (b.draft_position ?? 99));
      }
      // Fall back to hardcoded order
      return PLAYER_ORDER.map(name => rawUsers.find(u => u.display_name === name)).filter(Boolean) as GameUser[];
    })();
    setUsers(sortedUsers);
    setTeams(teamsRes.data || []);
    setPicks(picksRes.data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase.channel('draft-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'draft_picks' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  // Computed state
  const totalPicks = picks.length;
  const currentPickNumber = totalPicks + 1;
  const isDraftComplete = totalPicks >= 48;
  const currentPlayerIndex = isDraftComplete ? -1 : getPlayerIndexForPick(currentPickNumber);
  const currentPlayer = users[currentPlayerIndex] || null;
  const currentTier = isDraftComplete ? 0 : getTierForPickNumber(currentPickNumber);
  const direction = isDraftComplete ? 'forward' : getSnakeDirection(currentPickNumber);
  const isMyTurn = session && currentPlayer && session.display_name === currentPlayer.display_name;

  // Map teamId -> pick
  const pickByTeamId = new Map(picks.map(p => [p.team_id, p]));
  // Map userId -> user
  const userById = new Map(users.map(u => [u.id, u]));
  // Last pick
  const lastPick = picks.length > 0 ? picks[picks.length - 1] : null;

  async function handlePick(team: Team) {
    if (!isMyTurn || saving) return;
    setSaving(true);
    const pickNum = totalPicks + 1;
    // Re-validate server-side: check pick_number not taken
    const { count } = await supabase.from('draft_picks').select('*', { count: 'exact', head: true });
    if ((count ?? 0) !== totalPicks) {
      setSaving(false);
      await fetchData();
      return; // race condition — refetch
    }
    await supabase.from('draft_picks').insert({
      user_id: session!.id,
      team_id: team.id,
      pick_number: pickNum,
      tier: currentTier,
    });
    setSaving(false);
    setConfirm(null);
    fetchData();
  }

  async function handleUndo() {
    if (!lastPick || saving) return;
    setSaving(true);
    await supabase.from('draft_picks').delete().eq('id', lastPick.id);
    // log to audit_log
    await supabase.from('audit_log').insert({
      user_id: session!.id,
      action: 'UNDO_PICK',
      detail: `Undid pick #${lastPick.pick_number} (team_id: ${lastPick.team_id})`,
    });
    setSaving(false);
    setUndoConfirm(false);
    fetchData();
  }

  const canUndo = lastPick && (session?.is_admin || session?.id === lastPick.user_id);

  function toggleTier(t: number) {
    setOpenTiers(prev => {
      const next = new Set(prev);
      next.has(t) ? next.delete(t) : next.add(t);
      return next;
    });
  }

  // Teams grouped by tier
  const tierTeams = [1, 2, 3, 4].map(t => ({
    tier: t,
    teams: teams.filter(team => team.tier === t),
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-60">
        <div className="w-8 h-8 border-2 border-palace-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4 page-fade pb-4">
      {/* Top banner */}
      {!isDraftComplete ? (
        <div className="rounded-xl p-4 text-white" style={{ background: 'linear-gradient(135deg, #C4122E, #8B0D20)' }}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-white/70 uppercase tracking-wider">
              Pick {currentPickNumber} of 48 · Tier {currentTier}
            </span>
            <span className="text-xs text-white/60">{direction === 'forward' ? '→' : '←'} snake</span>
          </div>
          <div className="font-extrabold text-xl" style={{ color: currentPlayer?.accent_colour || 'white' }}>
            {isMyTurn ? '⭐ Your turn!' : `${currentPlayer?.display_name || '?'}'s turn`}
          </div>
          {!isMyTurn && <p className="text-white/60 text-xs mt-0.5">Waiting for {currentPlayer?.display_name} to pick</p>}
          {/* Progress bar */}
          <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-gold transition-all rounded-full" style={{ width: `${(totalPicks / 48) * 100}%` }} />
          </div>
          <div className="text-right text-xs text-white/50 mt-1">{totalPicks}/48 picks made</div>
        </div>
      ) : (
        <div className="card text-center py-6">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="font-bold text-white text-xl">Draft Complete!</h2>
          <p className="text-white/50 text-sm mt-1">All 48 teams have been drafted. Let the tournament begin!</p>
        </div>
      )}

      {/* Tier filter pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <button
          onClick={() => setTierFilter(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${tierFilter === null ? 'bg-palace-red text-white' : 'bg-white/10 text-white/60'}`}
        >
          All
        </button>
        {[1, 2, 3, 4].map(t => {
          const tc = TIER_COLORS[t];
          return (
            <button
              key={t}
              onClick={() => setTierFilter(tierFilter === t ? null : t)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${tierFilter === t ? 'bg-palace-red text-white' : 'bg-white/10 text-white/60'}`}
            >
              T{t} {tc.label}
            </button>
          );
        })}
      </div>

      {/* Tier sections */}
      {tierTeams
        .filter(({ tier }) => tierFilter === null || tierFilter === tier)
        .map(({ tier, teams: tierTeamList }) => {
          const tc = TIER_COLORS[tier];
          const isOpen = openTiers.has(tier);
          const draftedCount = tierTeamList.filter(t => pickByTeamId.has(t.id)).length;
          return (
            <div key={tier} className="card overflow-hidden p-0">
              <button
                onClick={() => toggleTier(tier)}
                className="w-full flex items-center gap-3 p-3 hover:bg-white/5 transition-colors"
              >
                <span className={`pill ${tc.bg} ${tc.text}`}>T{tier} · {tc.label}</span>
                <span className="text-white/40 text-xs ml-auto">{draftedCount}/{tierTeamList.length}</span>
                {isOpen ? <ChevronUp size={16} className="text-white/40" /> : <ChevronDown size={16} className="text-white/40" />}
              </button>
              {isOpen && (
                <div className="grid grid-cols-2 gap-2 p-3 pt-0">
                  {tierTeamList.map(team => {
                    const pick = pickByTeamId.get(team.id);
                    const drafter = pick ? userById.get(pick.user_id) : null;
                    const isDrafted = !!pick;
                    const isLastPick = lastPick?.team_id === team.id;
                    return (
                      <button
                        key={team.id}
                        onClick={() => {
                          if (isDrafted || !isMyTurn || saving) return;
                          setConfirm({ team });
                        }}
                        disabled={isDrafted || !isMyTurn}
                        className={`relative flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all
                          ${isDrafted
                            ? 'bg-white/3 border-white/5 opacity-50 cursor-default'
                            : isMyTurn
                              ? `border-white/20 hover:border-palace-red/60 hover:bg-white/5 active:scale-95 cursor-pointer ${tier === currentTier ? 'border-palace-red/30 bg-palace-red/5' : ''}`
                              : 'border-white/10 bg-white/3 cursor-default'
                          }`}
                      >
                        <span className="text-3xl">{team.flag_emoji}</span>
                        <span className="text-white text-xs font-semibold leading-tight">{team.name}</span>
                        <span className="text-white/40 text-[10px]">#{team.fifa_ranking} · Grp {team.fifa_group}</span>
                        {team.is_debut && <span className="text-[9px] font-bold text-gold bg-gold/15 px-1 rounded">DEBUT</span>}
                        {isDrafted && drafter && (
                          <span
                            className="text-xs font-semibold px-1.5 py-0.5 rounded-full"
                            style={{ color: drafter.accent_colour, backgroundColor: `${drafter.accent_colour}25` }}
                          >
                            {drafter.display_name}
                          </span>
                        )}
                        {isLastPick && (
                          <span className="absolute top-1 right-1">
                            <RotateCcw size={10} className="text-white/30" />
                          </span>
                        )}
                        {isDrafted && !isLastPick && (
                          <Lock size={10} className="absolute top-1 right-1 text-white/20" />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

      {/* Undo button */}
      {canUndo && lastPick && (
        <button
          onClick={() => setUndoConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-white/15 text-white/50 hover:border-white/30 hover:text-white/80 transition-all text-sm"
        >
          <RotateCcw size={14} />
          Undo last pick ({teams.find(t => t.id === lastPick.team_id)?.name})
        </button>
      )}

      {/* Confirm pick sheet */}
      {confirm && (
        <ConfirmSheet
          title={`Draft ${confirm.team.flag_emoji} ${confirm.team.name}?`}
          body={`This will be pick #${currentPickNumber} for ${session?.display_name}. Pick ${confirm.team.name} for your squad?`}
          confirmLabel="Draft it!"
          onConfirm={() => handlePick(confirm.team)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Confirm undo sheet */}
      {undoConfirm && lastPick && (
        <ConfirmSheet
          title="Undo last pick?"
          body={`This will remove ${teams.find(t => t.id === lastPick.team_id)?.name} from ${userById.get(lastPick.user_id)?.display_name}'s squad and rewind the draft by 1 pick.`}
          confirmLabel="Undo pick"
          onConfirm={handleUndo}
          onCancel={() => setUndoConfirm(false)}
          danger
        />
      )}
    </div>
  );
}

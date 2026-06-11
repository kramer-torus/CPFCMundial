'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { RefreshCw, Save, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import { Team, TeamPoints, Round, ROUNDS, ROUND_LABELS, TIER_COLORS } from '@/lib/types';

export default function ScoresPage() {
  return <AuthGuard adminOnly><ScoresAdmin /></AuthGuard>;
}

type ResultMap = Record<string, 'win' | 'draw' | 'loss' | 'runner-up' | null>;

interface SyncResult {
  ok: boolean;
  matchesProcessed?: number;
  rowsUpserted?: number;
  syncedAt?: string;
  unmappedTeams?: string[];
  error?: string;
}

const RESULT_POINTS: Record<string, Record<string, number>> = {
  win:          { GW1: 3, GW2: 3, GW3: 3, R32: 3, R16: 3, QF: 3, SF: 3, '3PO': 2, FINAL: 5 },
  draw:         { GW1: 1, GW2: 1, GW3: 1 },
  loss:         { GW1: 0, GW2: 0, GW3: 0 },
  'runner-up':  { FINAL: 3 },
};

function getPoints(result: string, round: string): number {
  return RESULT_POINTS[result]?.[round] ?? 0;
}

function ScoresAdmin() {
  const [round, setRound] = useState<Round>('GW1');
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<ResultMap>({});
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState('');
  const [lastSync, setLastSync] = useState<SyncResult | null>(null);

  const fetchTeams = useCallback(async () => {
    const [teamsRes, pointsRes] = await Promise.all([
      supabase.from('teams').select('*').order('tier').order('name'),
      supabase.from('team_points').select('*').eq('round', round),
    ]);
    const ts: Team[] = teamsRes.data || [];
    const pts: TeamPoints[] = pointsRes.data || [];
    setTeams(ts);
    const init: ResultMap = {};
    ts.forEach(t => {
      const existing = pts.find(p => p.team_id === t.id);
      if (!existing) { init[t.id] = null; return; }
      if (round === 'FINAL') {
        init[t.id] = existing.points === 5 ? 'win' : existing.points === 3 ? 'runner-up' : 'loss';
      } else if (round === '3PO') {
        init[t.id] = existing.points === 2 ? 'win' : 'loss';
      } else if (['GW1','GW2','GW3'].includes(round)) {
        init[t.id] = existing.points === 3 ? 'win' : existing.points === 1 ? 'draw' : 'loss';
      } else {
        init[t.id] = existing.points === 3 ? 'win' : 'loss';
      }
    });
    setResults(init);
  }, [round]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  async function handleSync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync-scores');
      const data: SyncResult = await res.json();
      setLastSync(data);
      if (data.ok) {
        await fetchTeams();
        showToast(`Synced — ${data.matchesProcessed} matches, ${data.rowsUpserted} rows updated`);
        broadcastLeaderboard().catch(() => {});
      } else {
        showToast(`Sync failed: ${data.error ?? 'unknown error'}`);
      }
    } catch {
      showToast('Network error during sync');
    } finally {
      setSyncing(false);
    }
  }

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  }

  function setResult(teamId: string, result: 'win' | 'draw' | 'loss' | 'runner-up') {
    setResults(prev => ({ ...prev, [teamId]: result }));
  }

  async function broadcastLeaderboard() {
    const [usersRes, picksRes, pointsRes] = await Promise.all([
      supabase.from('users').select('id, display_name'),
      supabase.from('draft_picks').select('user_id, team_id'),
      supabase.from('team_points').select('team_id, points'),
    ]);
    const users = usersRes.data || [];
    const picks = picksRes.data || [];
    const allPoints = pointsRes.data || [];
    const board = users.map((u: { id: string; display_name: string }) => {
      const myTeams = picks.filter((p: { user_id: string }) => p.user_id === u.id).map((p: { team_id: string }) => p.team_id);
      const pts = allPoints.filter((tp: { team_id: string }) => myTeams.includes(tp.team_id)).reduce((s: number, tp: { points: number }) => s + tp.points, 0);
      return { name: u.display_name, pts, alive: myTeams.length };
    }).sort((a: { pts: number }, b: { pts: number }) => b.pts - a.pts);
    await fetch('/api/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'leaderboard', board }),
    });
  }

  async function handleSave() {
    setSaving(true);
    const rows = teams
      .filter(t => results[t.id] !== null && results[t.id] !== undefined)
      .map(t => ({
        team_id: t.id,
        round,
        points: getPoints(results[t.id]!, round),
        updated_at: new Date().toISOString(),
      }));
    const { error } = await supabase.from('team_points').upsert(rows, { onConflict: 'team_id,round' });
    setSaving(false);
    if (!error) {
      showToast(`Saved — ${rows.length} teams updated`);
      broadcastLeaderboard().catch(() => {});
    }
  }

  const isGroupStage = ['GW1','GW2','GW3'].includes(round);
  const isFinal = round === 'FINAL';

  return (
    <div className="page-fade space-y-4 pb-4">
      <h1 className="font-display font-bold text-4xl text-white tracking-wide uppercase">Scores <span className="text-gold">📊</span></h1>

      {/* Live sync card */}
      <div className="card space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap size={15} className="text-neon" />
            <span className="font-bold text-white text-sm">Live Auto-Sync</span>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing}
            className="flex items-center gap-1.5 text-xs font-semibold bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
            {syncing ? 'Syncing…' : 'Sync Now'}
          </button>
        </div>

        {lastSync ? (
          <div className={`text-xs rounded-lg px-3 py-2 space-y-1 ${lastSync.ok ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
            {lastSync.ok ? (
              <>
                <div className="font-semibold">
                  ✓ {lastSync.matchesProcessed} matches · {lastSync.rowsUpserted} rows written
                </div>
                <div className="opacity-70">
                  {lastSync.syncedAt ? new Date(lastSync.syncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : ''}
                </div>
                {lastSync.unmappedTeams && lastSync.unmappedTeams.length > 0 && (
                  <div className="text-amber-400">⚠ Unmapped: {lastSync.unmappedTeams.join(', ')}</div>
                )}
              </>
            ) : (
              <div>✗ {lastSync.error}</div>
            )}
          </div>
        ) : (
          <p className="text-white/30 text-xs">
            Pulls live results from football-data.org every 5 min automatically. Hit Sync Now to force a refresh.
          </p>
        )}
      </div>

      {/* Manual override section */}
      <details className="group">
        <summary className="cursor-pointer text-xs font-bold text-white/30 uppercase tracking-widest list-none flex items-center gap-2 select-none">
          <span className="transition-transform group-open:rotate-90">▶</span>
          Manual Override
        </summary>
        <div className="mt-3 space-y-3">
          {/* Round selector */}
          <div className="overflow-x-auto -mx-4 px-4">
            <div className="flex gap-2 pb-1">
              {ROUNDS.map(r => (
                <button
                  key={r}
                  onClick={() => setRound(r)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${round === r ? 'bg-palace-red text-white' : 'bg-white/10 text-white/60'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <p className="text-white/40 text-xs">{ROUND_LABELS[round]}</p>

          {/* Teams list */}
          <div className="space-y-2">
            {teams.map(team => {
              const tc = TIER_COLORS[team.tier];
              const result = results[team.id];
              return (
                <div key={team.id} className="card flex items-center gap-3 p-3">
                  <span className="text-2xl">{team.flag_emoji}</span>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white text-sm">{team.name}</div>
                    <span className={`pill ${tc.bg} ${tc.text} text-[10px] mt-0.5`}>T{team.tier}</span>
                  </div>
                  <div className="flex gap-1.5 flex-shrink-0">
                    {isGroupStage && (['win','draw','loss'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setResult(team.id, r)}
                        className={`text-xs px-2 py-1.5 rounded-lg font-bold transition-all ${result === r ? 'bg-palace-red text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
                      >
                        {r === 'win' ? 'W' : r === 'draw' ? 'D' : 'L'}
                      </button>
                    ))}
                    {!isGroupStage && !isFinal && (
                      <>
                        <button onClick={() => setResult(team.id, 'win')} className={`text-xs px-2 py-1.5 rounded-lg font-bold transition-all ${result === 'win' ? 'bg-palace-red text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>W</button>
                        <button onClick={() => setResult(team.id, 'loss')} className={`text-xs px-2 py-1.5 rounded-lg font-bold transition-all ${result === 'loss' ? 'bg-rose-700 text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}>Out</button>
                      </>
                    )}
                    {isFinal && (
                      <>
                        <button onClick={() => setResult(team.id, 'win')} className={`text-xs px-2 py-1.5 rounded-lg font-bold transition-all ${result === 'win' ? 'bg-palace-red text-white' : 'bg-white/10 text-white/50'}`}>Win 5</button>
                        <button onClick={() => setResult(team.id, 'runner-up')} className={`text-xs px-2 py-1.5 rounded-lg font-bold transition-all ${result === 'runner-up' ? 'bg-amber-600 text-white' : 'bg-white/10 text-white/50'}`}>2nd 3</button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="sticky bottom-20 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full btn-primary flex items-center justify-center gap-2"
            >
              {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
              Save Override
            </button>
          </div>
        </div>
      </details>

      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-neon text-black font-bold px-4 py-2 rounded-xl text-sm z-50 animate-fade-in whitespace-nowrap">
          {toast}
        </div>
      )}
    </div>
  );
}

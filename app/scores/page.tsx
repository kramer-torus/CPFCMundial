'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import { Team, TeamPoints, Round, ROUNDS, ROUND_LABELS, TIER_COLORS } from '@/lib/types';

export default function ScoresPage() {
  return <AuthGuard adminOnly><ScoresAdmin /></AuthGuard>;
}

type ResultMap = Record<string, 'win' | 'draw' | 'loss' | 'runner-up' | null>;

const RESULT_POINTS: Record<string, Record<string, number>> = {
  win: { GW1: 3, GW2: 3, GW3: 3, R32: 3, R16: 3, QF: 3, SF: 3, '3PO': 2, FINAL: 5 },
  draw: { GW1: 1, GW2: 1, GW3: 1 },
  loss: { GW1: 0, GW2: 0, GW3: 0 },
  'runner-up': { FINAL: 3 },
};

function getPoints(result: string, round: string): number {
  return RESULT_POINTS[result]?.[round] ?? 0;
}

function ScoresAdmin() {
  const [round, setRound] = useState<Round>('GW1');
  const [teams, setTeams] = useState<Team[]>([]);
  const [results, setResults] = useState<ResultMap>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState('');

  const fetchTeams = useCallback(async () => {
    const [teamsRes, pointsRes] = await Promise.all([
      supabase.from('teams').select('*').order('tier').order('name'),
      supabase.from('team_points').select('*').eq('round', round),
    ]);
    const ts: Team[] = teamsRes.data || [];
    const pts: TeamPoints[] = pointsRes.data || [];
    setTeams(ts);
    // Reverse-map existing points to result labels
    const init: ResultMap = {};
    ts.forEach(t => {
      const existing = pts.find(p => p.team_id === t.id);
      if (!existing) { init[t.id] = null; return; }
      if (round === 'FINAL') {
        if (existing.points === 5) init[t.id] = 'win';
        else if (existing.points === 3) init[t.id] = 'runner-up';
        else init[t.id] = 'loss';
      } else if (round === '3PO') {
        init[t.id] = existing.points === 2 ? 'win' : 'loss';
      } else if (['GW1','GW2','GW3'].includes(round)) {
        if (existing.points === 3) init[t.id] = 'win';
        else if (existing.points === 1) init[t.id] = 'draw';
        else init[t.id] = 'loss';
      } else {
        init[t.id] = existing.points === 3 ? 'win' : 'loss';
      }
    });
    setResults(init);
  }, [round]);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  const isGroupStage = ['GW1','GW2','GW3'].includes(round);
  const isFinal = round === 'FINAL';

  function setResult(teamId: string, result: 'win' | 'draw' | 'loss' | 'runner-up') {
    setResults(prev => ({ ...prev, [teamId]: result }));
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
      setToast(`Saved! ${rows.length} teams updated`);
      setTimeout(() => setToast(''), 3000);
    }
  }

  return (
    <div className="page-fade space-y-4 pb-4">
      <h1 className="text-2xl font-extrabold text-white">Score Entry 📊</h1>

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
                {isGroupStage && (
                  <>
                    {(['win','draw','loss'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => setResult(team.id, r)}
                        className={`text-xs px-2 py-1.5 rounded-lg font-bold transition-all ${result === r ? 'bg-palace-red text-white' : 'bg-white/10 text-white/50 hover:bg-white/20'}`}
                      >
                        {r === 'win' ? 'W' : r === 'draw' ? 'D' : 'L'}
                      </button>
                    ))}
                  </>
                )}
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

      {/* Sticky save */}
      <div className="sticky bottom-20 pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full btn-primary flex items-center justify-center gap-2"
        >
          {saving ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save size={16} />}
          Save Round
        </button>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-neon text-black font-bold px-4 py-2 rounded-xl text-sm z-50 animate-fade-in">
          {toast}
        </div>
      )}
    </div>
  );
}

'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Team, TeamPoints, Round, ROUNDS, TIER_COLORS } from '@/lib/types';
import AdminPinModal from '@/components/AdminPinModal';

type ResultType = 'win' | 'draw' | 'loss' | 'eliminated' | 'runner-up' | 'none';

const GROUP_ROUNDS: Round[] = ['GW1', 'GW2', 'GW3'];
const KNOCKOUT_ROUNDS: Round[] = ['R32', 'R16', 'QF', 'SF'];
const SPECIAL_ROUNDS: Round[] = ['3PO', 'FINAL'];

function getPointsForResult(result: ResultType, round: Round): number {
  if (result === 'none') return 0;
  if (round === 'FINAL') {
    if (result === 'win') return 5;
    if (result === 'runner-up') return 3;
    return 0;
  }
  if (round === '3PO') {
    if (result === 'win') return 2;
    return 0;
  }
  if (GROUP_ROUNDS.includes(round as Round)) {
    if (result === 'win') return 3;
    if (result === 'draw') return 1;
    return 0;
  }
  // Knockout
  if (result === 'win') return 3;
  return 0; // eliminated
}

function getResultFromPoints(points: number, round: Round): ResultType {
  if (round === 'FINAL') {
    if (points === 5) return 'win';
    if (points === 3) return 'runner-up';
    if (points === 0) return 'eliminated';
    return 'none';
  }
  if (round === '3PO') {
    if (points === 2) return 'win';
    if (points === 0) return 'loss';
    return 'none';
  }
  if (GROUP_ROUNDS.includes(round as Round)) {
    if (points === 3) return 'win';
    if (points === 1) return 'draw';
    if (points === 0) return 'loss';
    return 'none';
  }
  // Knockout
  if (points === 3) return 'win';
  if (points === 0) return 'eliminated';
  return 'none';
}

export default function ScoresPage() {
  const [authed, setAuthed] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [selectedRound, setSelectedRound] = useState<Round>('GW1');
  const [teams, setTeams] = useState<Team[]>([]);
  const [existingPoints, setExistingPoints] = useState<TeamPoints[]>([]);
  const [results, setResults] = useState<Record<string, ResultType>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Check session storage for auth
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isAuthed = sessionStorage.getItem('cpfc-admin-authed') === '1';
      if (isAuthed) setAuthed(true);
      else setShowPin(true);
    }
  }, []);

  const fetchTeamsAndPoints = useCallback(async () => {
    const [teamsRes, pointsRes] = await Promise.all([
      supabase.from('teams').select('*').order('tier').order('name'),
      supabase.from('team_points').select('*').eq('round', selectedRound),
    ]);
    const teamsData: Team[] = teamsRes.data || [];
    const pointsData: TeamPoints[] = pointsRes.data || [];

    setTeams(teamsData);
    setExistingPoints(pointsData);

    // Initialize results from existing points
    const initResults: Record<string, ResultType> = {};
    for (const team of teamsData) {
      const existing = pointsData.find(p => p.team_id === team.id);
      if (existing) {
        initResults[team.id] = getResultFromPoints(existing.points, selectedRound);
      } else {
        initResults[team.id] = 'none';
      }
    }
    setResults(initResults);
    setLoading(false);
  }, [selectedRound]);

  useEffect(() => {
    if (authed) fetchTeamsAndPoints();
  }, [authed, fetchTeamsAndPoints]);

  function setResult(teamId: string, result: ResultType) {
    setResults(prev => ({ ...prev, [teamId]: result }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const rows = teams
      .filter(t => results[t.id] && results[t.id] !== 'none')
      .map(t => ({
        team_id: t.id,
        round: selectedRound,
        points: getPointsForResult(results[t.id], selectedRound),
        updated_at: new Date().toISOString(),
      }));

    if (rows.length > 0) {
      const { error } = await supabase
        .from('team_points')
        .upsert(rows, { onConflict: 'team_id,round' });
      if (error) console.error(error);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (showPin && !authed) {
    return (
      <AdminPinModal
        onSuccess={() => {
          sessionStorage.setItem('cpfc-admin-authed', '1');
          setAuthed(true);
          setShowPin(false);
        }}
        onCancel={() => setShowPin(false)}
      />
    );
  }

  if (!authed) {
    return (
      <div className="text-center py-16">
        <p className="text-white/60 mb-4">Admin access required</p>
        <button onClick={() => setShowPin(true)} className="btn-primary">
          Enter PIN
        </button>
      </div>
    );
  }

  const isGroupRound = GROUP_ROUNDS.includes(selectedRound as Round);
  const isKnockout = KNOCKOUT_ROUNDS.includes(selectedRound as Round);
  const is3PO = selectedRound === '3PO';
  const isFinal = selectedRound === 'FINAL';

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Score Entry 📊</h1>
        <span className="text-xs text-gold/70 font-medium bg-gold/10 px-2 py-1 rounded-full">Admin</span>
      </div>

      {/* Round selector */}
      <div>
        <label className="text-xs text-white/50 uppercase tracking-wider mb-2 block">Round</label>
        <select
          value={selectedRound}
          onChange={e => setSelectedRound(e.target.value as Round)}
          className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white focus:outline-none focus:border-gold appearance-none"
        >
          {ROUNDS.map(r => (
            <option key={r} value={r} className="bg-navy">
              {r === 'GW1' ? 'GW1 – Group Week 1' :
               r === 'GW2' ? 'GW2 – Group Week 2' :
               r === 'GW3' ? 'GW3 – Group Week 3' :
               r === 'R32' ? 'R32 – Round of 32' :
               r === 'R16' ? 'R16 – Round of 16' :
               r === 'QF' ? 'QF – Quarter-Finals' :
               r === 'SF' ? 'SF – Semi-Finals' :
               r === '3PO' ? '3PO – 3rd Place Play-off' :
               r === 'FINAL' ? 'FINAL – Final' : r}
            </option>
          ))}
        </select>
      </div>

      {/* Scoring guide */}
      <div className="card text-xs text-white/60 space-y-1 border border-gold/10">
        {isGroupRound && <p>Win = 3pts &nbsp;·&nbsp; Draw = 1pt &nbsp;·&nbsp; Loss = 0pts</p>}
        {isKnockout && <p>Win = 3pts &nbsp;·&nbsp; Eliminated = 0pts</p>}
        {is3PO && <p>3rd Place Play-off &nbsp;·&nbsp; Win = 2pts &nbsp;·&nbsp; Loss = 0pts</p>}
        {isFinal && <p>Champions = 5pts &nbsp;·&nbsp; Runners-up = 3pts</p>}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-16 bg-white/5 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {teams.map(team => {
            const tc = TIER_COLORS[team.tier];
            const current = results[team.id] || 'none';

            return (
              <div key={team.id} className="card p-3 flex items-center gap-3">
                <span className="text-2xl">{team.flag_emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-white text-sm leading-tight">{team.name}</div>
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${tc.bg} ${tc.text}`}>T{team.tier}</span>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {isGroupRound && (
                    <>
                      <ResultBtn label="W" sublabel="+3" active={current === 'win'} onClick={() => setResult(team.id, current === 'win' ? 'none' : 'win')} color="emerald" />
                      <ResultBtn label="D" sublabel="+1" active={current === 'draw'} onClick={() => setResult(team.id, current === 'draw' ? 'none' : 'draw')} color="amber" />
                      <ResultBtn label="L" sublabel="0" active={current === 'loss'} onClick={() => setResult(team.id, current === 'loss' ? 'none' : 'loss')} color="rose" />
                    </>
                  )}
                  {isKnockout && (
                    <>
                      <ResultBtn label="Win" sublabel="+3" active={current === 'win'} onClick={() => setResult(team.id, current === 'win' ? 'none' : 'win')} color="emerald" />
                      <ResultBtn label="Out" sublabel="0" active={current === 'eliminated'} onClick={() => setResult(team.id, current === 'eliminated' ? 'none' : 'eliminated')} color="rose" />
                    </>
                  )}
                  {is3PO && (
                    <>
                      <ResultBtn label="Win" sublabel="+2" active={current === 'win'} onClick={() => setResult(team.id, current === 'win' ? 'none' : 'win')} color="emerald" />
                      <ResultBtn label="Loss" sublabel="0" active={current === 'loss'} onClick={() => setResult(team.id, current === 'loss' ? 'none' : 'loss')} color="rose" />
                    </>
                  )}
                  {isFinal && (
                    <>
                      <ResultBtn label="🏆" sublabel="+5" active={current === 'win'} onClick={() => setResult(team.id, current === 'win' ? 'none' : 'win')} color="gold" />
                      <ResultBtn label="🥈" sublabel="+3" active={current === 'runner-up'} onClick={() => setResult(team.id, current === 'runner-up' ? 'none' : 'runner-up')} color="amber" />
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`w-full font-bold py-4 rounded-xl transition-all ${
          saved
            ? 'bg-emerald-600 text-white'
            : saving
            ? 'bg-white/20 text-white/50 cursor-not-allowed'
            : 'btn-primary'
        }`}
      >
        {saved ? '✓ Saved!' : saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}

function ResultBtn({
  label,
  sublabel,
  active,
  onClick,
  color,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  onClick: () => void;
  color: 'emerald' | 'amber' | 'rose' | 'gold';
}) {
  const colorMap = {
    emerald: active ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-white/5 text-white/60 border-white/10 hover:border-emerald-500/50',
    amber: active ? 'bg-amber-500 text-white border-amber-400' : 'bg-white/5 text-white/60 border-white/10 hover:border-amber-400/50',
    rose: active ? 'bg-rose-700 text-white border-rose-600' : 'bg-white/5 text-white/60 border-white/10 hover:border-rose-600/50',
    gold: active ? 'bg-yellow-500 text-navy border-yellow-400' : 'bg-white/5 text-white/60 border-white/10 hover:border-yellow-400/50',
  };

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center px-2 py-1.5 rounded-lg border transition-all active:scale-95 min-w-[40px] ${colorMap[color]}`}
    >
      <span className="text-xs font-bold leading-none">{label}</span>
      <span className="text-xs opacity-70 leading-none mt-0.5">{sublabel}</span>
    </button>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Team, TeamPoints, Round, ROUNDS, TIER_COLORS } from '@/lib/types';
import AdminPinModal from '@/components/AdminPinModal';

type ResultMap = Record<string, string>; // team_id → result string

const ROUND_LABELS: Record<Round, string> = {
  GW1: 'Group Stage — Matchday 1',
  GW2: 'Group Stage — Matchday 2',
  GW3: 'Group Stage — Matchday 3',
  R32: 'Round of 32',
  R16: 'Round of 16',
  QF: 'Quarter-Finals',
  SF: 'Semi-Finals',
  '3PO': '3rd Place Play-off',
  FINAL: 'Final',
};

const GROUP_ROUNDS: Round[] = ['GW1', 'GW2', 'GW3'];
const KNOCKOUT_ROUNDS: Round[] = ['R32', 'R16', 'QF', 'SF'];

function getPointsForResult(result: string, round: Round): number {
  if (round === 'FINAL') {
    if (result === 'winner') return 5;
    if (result === 'runner-up') return 3;
    return 0;
  }
  if (round === '3PO') {
    return result === 'win' ? 2 : 0;
  }
  if (GROUP_ROUNDS.includes(round)) {
    if (result === 'win') return 3;
    if (result === 'draw') return 1;
    return 0;
  }
  // Knockout
  return result === 'win' ? 3 : 0;
}

function ResultButtons({
  round,
  value,
  onChange,
}: {
  round: Round;
  value: string;
  onChange: (v: string) => void;
}) {
  const isGroup = GROUP_ROUNDS.includes(round);
  const isFinal = round === 'FINAL';
  const is3PO = round === '3PO';

  let options: { value: string; label: string; pts: string }[] = [];

  if (isFinal) {
    options = [
      { value: 'winner', label: 'Winner', pts: '5pts' },
      { value: 'runner-up', label: 'Runner-up', pts: '3pts' },
      { value: 'none', label: '—', pts: '' },
    ];
  } else if (is3PO) {
    options = [
      { value: 'win', label: '3rd Place Win', pts: '2pts' },
      { value: 'loss', label: 'Loss', pts: '0pts' },
      { value: 'none', label: '—', pts: '' },
    ];
  } else if (isGroup) {
    options = [
      { value: 'win', label: 'Win', pts: '3pts' },
      { value: 'draw', label: 'Draw', pts: '1pt' },
      { value: 'loss', label: 'Loss', pts: '0pts' },
    ];
  } else {
    options = [
      { value: 'win', label: 'Win', pts: '3pts' },
      { value: 'eliminated', label: 'Eliminated', pts: '0pts' },
    ];
  }

  return (
    <div className="flex gap-1 flex-wrap">
      {options.map(opt => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-xs px-2 py-1.5 rounded-lg font-semibold transition-colors border ${
            value === opt.value
              ? 'bg-palace-red border-palace-red text-white'
              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/15'
          }`}
        >
          {opt.label}
          {opt.pts && <span className="ml-1 opacity-60">{opt.pts}</span>}
        </button>
      ))}
    </div>
  );
}

export default function ScoresPage() {
  const [authed, setAuthed] = useState(false);
  const [showPin, setShowPin] = useState(true);
  const [teams, setTeams] = useState<Team[]>([]);
  const [existingPoints, setExistingPoints] = useState<TeamPoints[]>([]);
  const [round, setRound] = useState<Round>('GW1');
  const [results, setResults] = useState<ResultMap>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem('cpfc-admin-authed');
    if (stored === '1') { setAuthed(true); setShowPin(false); }
  }, []);

  useEffect(() => {
    if (!authed) return;
    async function load() {
      setLoading(true);
      const [{ data: t }, { data: tp }] = await Promise.all([
        supabase.from('teams').select('*').order('tier').order('name'),
        supabase.from('team_points').select('*').eq('round', round),
      ]);
      if (t) setTeams(t);
      if (tp) {
        setExistingPoints(tp);
        // Initialise result state from saved points
        const init: ResultMap = {};
        for (const p of tp) {
          const r = reversePoints(p.points, round);
          if (r) init[p.team_id] = r;
        }
        setResults(init);
      } else {
        setResults({});
      }
      setLoading(false);
    }
    load();
  }, [authed, round]);

  function reversePoints(points: number, r: Round): string {
    if (r === 'FINAL') {
      if (points === 5) return 'winner';
      if (points === 3) return 'runner-up';
      return 'none';
    }
    if (r === '3PO') return points === 2 ? 'win' : points === 0 ? 'loss' : 'none';
    if (GROUP_ROUNDS.includes(r)) {
      if (points === 3) return 'win';
      if (points === 1) return 'draw';
      if (points === 0) return 'loss';
    }
    // Knockout
    if (points === 3) return 'win';
    if (points === 0) return 'eliminated';
    return 'none';
  }

  function setResult(teamId: string, value: string) {
    setResults(prev => ({ ...prev, [teamId]: value }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    const rows = Object.entries(results)
      .filter(([, v]) => v && v !== 'none')
      .map(([team_id, result]) => ({
        team_id,
        round,
        points: getPointsForResult(result, round),
        updated_at: new Date().toISOString(),
      }));

    if (rows.length > 0) {
      await supabase.from('team_points').upsert(rows, { onConflict: 'team_id,round' });
    }

    // Remove any entries set to 'none' that may exist in DB
    const noneIds = Object.entries(results)
      .filter(([, v]) => v === 'none')
      .map(([id]) => id);
    if (noneIds.length > 0) {
      await supabase.from('team_points').delete().eq('round', round).in('team_id', noneIds);
    }

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (showPin && !authed) {
    return (
      <AdminPinModal
        onSuccess={() => { sessionStorage.setItem('cpfc-admin-authed', '1'); setAuthed(true); setShowPin(false); }}
        onCancel={() => {}}
      />
    );
  }

  const tierGroups: Record<number, Team[]> = { 1: [], 2: [], 3: [], 4: [] };
  for (const t of teams) tierGroups[t.tier].push(t);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-gold">Score Entry 📊</h1>
        <span className="text-xs bg-palace-red/30 text-palace-red px-2 py-1 rounded-full font-semibold">Admin</span>
      </div>

      {/* Round selector */}
      <div>
        <label className="text-white/60 text-sm font-medium block mb-1.5">Round</label>
        <select
          value={round}
          onChange={e => setRound(e.target.value as Round)}
          className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-gold appearance-none"
        >
          {ROUNDS.map(r => (
            <option key={r} value={r} className="bg-navy">{r} — {ROUND_LABELS[r]}</option>
          ))}
        </select>
      </div>

      <p className="text-white/50 text-sm">{ROUND_LABELS[round]}</p>

      {/* Team list by tier */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(12)].map((_, i) => <div key={i} className="card h-16 animate-pulse bg-white/5" />)}
        </div>
      ) : (
        <div className="space-y-4">
          {([1, 2, 3, 4] as const).map(tier => {
            const tierInfo = TIER_COLORS[tier];
            const tierTeams = tierGroups[tier];
            if (!tierTeams.length) return null;
            return (
              <div key={tier}>
                <h3 className={`text-xs font-bold px-3 py-1.5 rounded-full inline-block mb-2 ${tierInfo.bg} ${tierInfo.text}`}>
                  Tier {tier}
                </h3>
                <div className="space-y-2">
                  {tierTeams.map(team => (
                    <div key={team.id} className="card py-3">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{team.flag_emoji}</span>
                        <span className="font-semibold text-sm">{team.name}</span>
                        {results[team.id] && results[team.id] !== 'none' && (
                          <span className="ml-auto text-gold font-bold text-sm">
                            {getPointsForResult(results[team.id], round)}pts
                          </span>
                        )}
                      </div>
                      <ResultButtons
                        round={round}
                        value={results[team.id] ?? ''}
                        onChange={v => setResult(team.id, v)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Save button */}
      {!loading && teams.length > 0 && (
        <div className="sticky bottom-24 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              saved
                ? 'bg-emerald-600 text-white'
                : 'btn-primary'
            }`}
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Results'}
          </button>
        </div>
      )}
    </div>
  );
}

'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { Share2, Check, Copy, Newspaper, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import { GameUser, DraftPick, Team, TeamPoints, KNOCKOUT_ROUNDS } from '@/lib/types';

// Expected future points from an alive team, weighted by tier.
// T1 elites run deep; T4 wildcards scrape group points at best.
const TIER_FUTURE_PTS: Record<number, number> = { 1: 14, 2: 9, 3: 5, 4: 3 };

interface Bulletin {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

interface OddsRow {
  user_id: string;
  display_name: string;
  accent_colour: string;
  points: number;
  teams_alive: number;
  squad_strength: number;
  odds: string;
}

function calcOdds(users: GameUser[], picks: DraftPick[], teams: Team[], points: TeamPoints[]): OddsRow[] {
  const teamById = new Map(teams.map(t => [t.id, t]));
  const eliminatedIds = new Set(
    points.filter(tp => KNOCKOUT_ROUNDS.includes(tp.round) && tp.points === 0).map(tp => tp.team_id),
  );

  const rows = users.map(u => {
    const myPicks = picks.filter(p => p.user_id === u.id);
    const currentPoints = points
      .filter(tp => myPicks.some(p => p.team_id === tp.team_id))
      .reduce((s, tp) => s + tp.points, 0);
    const alivePicks = myPicks.filter(p => !eliminatedIds.has(p.team_id));
    const expectedFuture = alivePicks.reduce((s, p) => {
      const tier = teamById.get(p.team_id)?.tier ?? 4;
      return s + (TIER_FUTURE_PTS[tier] ?? 3);
    }, 0);
    return {
      user_id: u.id,
      display_name: u.display_name,
      accent_colour: u.accent_colour,
      points: currentPoints,
      teams_alive: alivePicks.length,
      strength: currentPoints + expectedFuture,
      squad_strength: expectedFuture,
    };
  });

  const total = rows.reduce((s, r) => s + r.strength, 0);
  return rows
    .map(r => ({
      user_id: r.user_id,
      display_name: r.display_name,
      accent_colour: r.accent_colour,
      points: r.points,
      teams_alive: r.teams_alive,
      squad_strength: r.squad_strength,
      odds: total === 0 || r.strength === 0 ? '—' : (total / r.strength).toFixed(1),
    }))
    .sort((a, b) => (parseFloat(a.odds) || 999) - (parseFloat(b.odds) || 999));
}

export default function BulletinPage() {
  return <AuthGuard><BulletinFeed /></AuthGuard>;
}

function OddsTracker() {
  const [rows, setRows] = useState<OddsRow[]>([]);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchOdds = useCallback(async () => {
    const [usersRes, picksRes, teamsRes, pointsRes] = await Promise.all([
      supabase.from('users').select('*'),
      supabase.from('draft_picks').select('*'),
      supabase.from('teams').select('id, tier'),
      supabase.from('team_points').select('*'),
    ]);
    const users: GameUser[] = usersRes.data || [];
    const picks: DraftPick[] = picksRes.data || [];
    const teams = (teamsRes.data || []) as Team[];
    const points: TeamPoints[] = pointsRes.data || [];
    if (users.length && picks.length && teams.length) {
      setRows(calcOdds(users, picks, teams, points));
      setUpdatedAt(new Date());
    }
  }, []);

  useEffect(() => {
    fetchOdds();
    const ch = supabase.channel('odds-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_points' }, fetchOdds)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchOdds]);

  if (!rows.length) return null;

  const favourite = rows[0];
  const maxOdds = Math.max(...rows.map(r => parseFloat(r.odds) || 0));

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp size={16} className="text-gold" />
          <span className="text-gold font-bold text-sm uppercase tracking-wider">Live Odds</span>
        </div>
        {updatedAt && (
          <span className="text-white/25 text-[10px] tabular-nums">
            updated {updatedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
      <div className="space-y-1.5">
        {rows.map((r, i) => {
          const isFav = i === 0 && r.odds !== '—';
          const oddsNum = parseFloat(r.odds) || 0;
          const barWidth = maxOdds > 0 ? `${Math.round((maxOdds - oddsNum + 1) / maxOdds * 100)}%` : '0%';
          return (
            <div
              key={r.user_id}
              className="relative flex items-center gap-2 rounded-lg px-2.5 py-2 overflow-hidden"
              style={{ borderWidth: isFav ? 1 : 0, borderColor: `${r.accent_colour}35` }}
            >
              {/* strength bar */}
              <div
                className="absolute inset-y-0 left-0 rounded-lg opacity-10"
                style={{ width: barWidth, background: r.accent_colour }}
              />
              <div className="relative w-4 flex-shrink-0 text-center text-white/30 text-xs font-bold">{i + 1}</div>
              <div className="relative flex-1 min-w-0">
                <span className="text-white text-sm font-semibold">{r.display_name}</span>
                <span className="text-white/30 text-xs ml-2 tabular-nums">{r.points}pts · {r.teams_alive} alive</span>
              </div>
              <div className="relative flex-shrink-0 text-right">
                <span
                  className="font-display font-bold text-xl tabular-nums leading-none"
                  style={{ color: isFav ? r.accent_colour : oddsNum > 6 ? '#ffffff35' : '#ffffff70' }}
                >
                  {r.odds}
                </span>
                {r.odds !== '—' && <span className="text-white/25 text-[10px] ml-0.5">x</span>}
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-white/20 text-[10px]">
        Weighted by squad tier: T1 squads valued at 14 expected pts, T2 at 9, T3 at 5, T4 at 3 — plus points already scored. {favourite.display_name} leads at {favourite.odds}x.
      </p>
    </div>
  );
}

function BulletinFeed() {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('audit_log')
        .select('id, detail, created_at')
        .eq('action', 'DAILY_WRAP')
        .order('created_at', { ascending: false })
        .limit(30);
      const parsed: Bulletin[] = (data || []).flatMap(row => {
        try {
          const d = JSON.parse(row.detail) as { title: string; body: string };
          return [{ id: row.id, title: d.title, body: d.body, created_at: row.created_at }];
        } catch {
          return [];
        }
      });
      setBulletins(parsed);
    } catch {
      // network failure — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase
      .channel('wraps-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'audit_log' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  async function share(b: Bulletin) {
    if (navigator.share) {
      await navigator.share({ text: b.body }).catch(() => {});
      return;
    }
    await navigator.clipboard.writeText(b.body).catch(() => {});
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  async function copy(b: Bulletin) {
    await navigator.clipboard.writeText(b.body).catch(() => {});
    setCopiedId(b.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  }

  return (
    <div className="page-fade space-y-4 pb-6">
      <div className="flex items-center gap-2">
        <Newspaper className="text-palace-red" size={22} />
        <h1 className="text-2xl font-extrabold text-white">Daily Wrap 📋</h1>
      </div>
      <p className="text-white/50 text-sm -mt-2">Your daily round-up — standings, movers and banter, posted automatically. Read it right here. Want to forward it? Tap <span className="text-gold font-semibold">Share</span>.</p>

      <OddsTracker />

      {loading ? (
        <div className="space-y-3">
          {[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-bg-card rounded-xl animate-pulse" />)}
        </div>
      ) : bulletins.length === 0 ? (
        <div className="card text-center py-12 space-y-3">
          <div className="text-5xl">📰</div>
          <p className="font-display font-bold text-xl text-white tracking-wide">NO BULLETINS YET</p>
          <p className="text-white/40 text-sm">The first one drops once the tournament gets going. Check back soon.</p>
        </div>
      ) : (
        bulletins.map((b) => (
          <div key={b.id} className="card space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-palace-red font-bold text-sm uppercase tracking-wider">{b.title}</span>
              <span className="text-white/30 text-xs tabular-nums">{fmtDate(b.created_at)}</span>
            </div>
            <pre className="whitespace-pre-wrap break-words font-sans text-white/85 text-sm leading-relaxed">{b.body}</pre>
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-white/5">
              <button
                onClick={() => copy(b)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/45 hover:text-white/80 text-xs active:scale-95 transition-all"
                aria-label="Copy wrap text"
              >
                {copiedId === b.id ? <Check size={14} /> : <Copy size={14} />}
                {copiedId === b.id ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={() => share(b)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-white/45 hover:text-white/80 text-xs active:scale-95 transition-all"
                aria-label="Share wrap"
              >
                <Share2 size={14} />
                Share
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

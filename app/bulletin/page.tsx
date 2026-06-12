'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { Share2, Check, Copy, Newspaper, TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import { ODDS_SNAPSHOT_ACTION, type OddsEntry, type OddsSnapshot } from '@/lib/odds';

interface Bulletin {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export default function BulletinPage() {
  return <AuthGuard><BulletinFeed /></AuthGuard>;
}

function OddsTracker() {
  const [snapshot, setSnapshot] = useState<OddsSnapshot | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const fetchSnapshot = useCallback(async () => {
    const { data } = await supabase
      .from('audit_log')
      .select('detail, created_at')
      .eq('action', ODDS_SNAPSHOT_ACTION)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) {
      try {
        const parsed = JSON.parse(data.detail) as OddsSnapshot;
        setSnapshot(parsed);
        setUpdatedAt(new Date(data.created_at));
      } catch { /* ignore malformed */ }
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
    const ch = supabase.channel('odds-snap-rt')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_log' }, fetchSnapshot)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchSnapshot]);

  if (!snapshot?.rows?.length) return null;

  const rows: OddsEntry[] = snapshot.rows;
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

      {/* Compact odds table */}
      <div className="space-y-1">
        {rows.map((r, i) => {
          const isFav = i === 0 && r.odds !== '—';
          const oddsNum = parseFloat(r.odds) || 0;
          const barPct = maxOdds > 0 ? Math.round((maxOdds - oddsNum + 1) / maxOdds * 100) : 0;
          return (
            <div
              key={r.user_id}
              className="relative flex items-center gap-2 rounded-lg px-2.5 py-2 overflow-hidden"
              style={{ borderWidth: isFav ? 1 : 0, borderColor: `${r.accent_colour}35` }}
            >
              <div className="absolute inset-y-0 left-0 rounded-lg opacity-10 pointer-events-none"
                style={{ width: `${barPct}%`, background: r.accent_colour }} />
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

      {/* Narrative blurbs */}
      <div className="border-t border-white/5 pt-3 space-y-1.5">
        {rows.map(r => (
          <p key={r.user_id} className="text-white/55 text-xs leading-snug">
            {r.blurb}
          </p>
        ))}
      </div>

      <p className="text-white/20 text-[10px]">
        Tier-weighted odds — T1 elite squads valued at 14 expected pts, T2 9, T3 5, T4 3, plus points scored. Recalculates when scores change.
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

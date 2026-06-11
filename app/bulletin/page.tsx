'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState, useCallback } from 'react';
import { Share2, Check, Copy, Newspaper } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';

interface Bulletin {
  id: string;
  title: string;
  body: string;
  created_at: string;
}

export default function BulletinPage() {
  return <AuthGuard><BulletinFeed /></AuthGuard>;
}

function BulletinFeed() {
  const [bulletins, setBulletins] = useState<Bulletin[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('bulletins')
        .select('id, title, body, created_at')
        .order('created_at', { ascending: false })
        .limit(30);
      setBulletins(data || []);
    } catch {
      // network failure — show empty state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const ch = supabase
      .channel('bulletins-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bulletins' }, fetchData)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [fetchData]);

  async function share(b: Bulletin) {
    // Native share sheet → pick the WhatsApp group directly (best path on mobile).
    if (navigator.share) {
      await navigator.share({ text: b.body }).catch(() => {});
      return;
    }
    // Desktop fallback — copy to clipboard.
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

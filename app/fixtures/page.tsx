'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { RefreshCw, Calendar } from 'lucide-react';
import { fetchWorldCupFixtures, type Fixture } from '@/lib/fixtures';
import { supabase } from '@/lib/supabase';
import { DraftPick, GameUser } from '@/lib/types';

function groupByDate(fixtures: Fixture[]) {
  const groups: Record<string, Fixture[]> = {};
  for (const f of fixtures) {
    const date = new Date(f.kickoff).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    if (!groups[date]) groups[date] = [];
    groups[date].push(f);
  }
  return Object.entries(groups);
}

export default function FixturesPage() {
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [users, setUsers] = useState<GameUser[]>([]);

  async function load() {
    setLoading(true);
    try {
      const [{ fixtures: f, error: e }, picksRes, usersRes] = await Promise.all([
        fetchWorldCupFixtures(),
        supabase.from('draft_picks').select('*'),
        supabase.from('users').select('*'),
      ]);
      setFixtures(f);
      setError(e);
      setPicks(picksRes.data || []);
      setUsers(usersRes.data || []);
      setLastFetch(new Date());
    } catch {
      setError('FETCH_ERROR');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const grouped = groupByDate(fixtures);

  return (
    <div className="page-fade space-y-4 pb-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-white">Fixtures 📅</h1>
        <button onClick={load} disabled={loading} className="text-white/40 hover:text-white transition-colors">
          <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error === 'NOT_AVAILABLE' || error === 'NO_KEY' ? (
        <div className="card py-8 text-center space-y-3">
          <Calendar size={40} className="mx-auto text-white/20" />
          <h3 className="font-bold text-white">Live fixtures coming soon</h3>
          <p className="text-white/50 text-sm leading-relaxed">
            Live World Cup fixtures appear here once the feed is available.<br />
            <span className="text-gold">Tournament kicks off 11 June 2026.</span>
          </p>
          {/* Static schedule */}
          <div className="mt-4 text-left space-y-1.5 text-sm border-t border-white/10 pt-4">
            {[
              ['Group Stage', 'Jun 11 – Jun 27'],
              ['Round of 32', 'Jun 28 – Jul 3'],
              ['Round of 16', 'Jul 4 – Jul 7'],
              ['Quarter-finals', 'Jul 9 – Jul 11'],
              ['Semi-finals', 'Jul 14 – Jul 15'],
              ['3rd Place', 'Jul 18'],
              ['Final 🏆', 'Jul 19 · MetLife Stadium, NJ'],
            ].map(([s, d]) => (
              <div key={s} className="flex justify-between">
                <span className="text-white/60">{s}</span>
                <span className="text-white/30 text-xs">{d}</span>
              </div>
            ))}
          </div>
          <p className="text-white/20 text-xs mt-3">
            football-data.org free tier excludes the World Cup. Swap to API-Football in lib/fixtures.ts for live WC data.
          </p>
        </div>
      ) : error ? (
        <div className="card py-6 text-center">
          <p className="text-white/50 text-sm">Unable to load fixtures. Try refreshing.</p>
          <button onClick={load} className="btn-primary mt-3 text-sm">Retry</button>
        </div>
      ) : loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : fixtures.length === 0 ? (
        <div className="card py-8 text-center">
          <p className="text-white/50 text-sm">No fixtures found.</p>
        </div>
      ) : (
        <>
          {lastFetch && <p className="text-white/30 text-xs">Cached · Updated {lastFetch.toLocaleTimeString()}</p>}
          {grouped.map(([date, dayFixtures]) => (
            <div key={date}>
              <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{date}</h3>
              <div className="space-y-2">
                {dayFixtures.map(f => {
                  const isLive = f.status === 'LIVE';
                  const isDone = f.status === 'FINISHED';
                  return (
                    <div key={f.id} className="card p-3">
                      <div className="flex items-center gap-2 justify-between">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-xl">{f.homeFlag || '🏳️'}</span>
                          <span className="font-semibold text-white text-sm truncate">{f.homeTeam}</span>
                        </div>
                        <div className="text-center flex-shrink-0 px-2">
                          {isLive && (
                            <span className="flex items-center gap-1 text-palace-red font-bold text-xs">
                              <span className="w-1.5 h-1.5 bg-palace-red rounded-full animate-pulse" />LIVE
                            </span>
                          )}
                          {isDone && <span className="text-white font-bold text-sm">{f.homeScore} – {f.awayScore}</span>}
                          {!isLive && !isDone && (
                            <span className="text-white/40 text-xs">
                              {new Date(f.kickoff).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 flex-1 min-w-0 justify-end">
                          <span className="font-semibold text-white text-sm truncate text-right">{f.awayTeam}</span>
                          <span className="text-xl">{f.awayFlag || '🏳️'}</span>
                        </div>
                      </div>
                      {f.stage && <p className="text-white/30 text-xs mt-1.5 text-center">{f.stage}{f.group ? ` · ${f.group}` : ''}</p>}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/auth';
import { DraftPick, GameUser, Team } from '@/lib/types';
import type { FixtureMatch } from '@/app/api/fixtures/route';

const TEAM_NAME_MAP: Record<string, string> = {
  'IR Iran': 'Iran',
  'Korea Republic': 'South Korea',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Czech Republic': 'Czechia',
  'Cape Verde Islands': 'Cape Verde',
  'Curaçao': 'Curacao',
  'Congo DR': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
};

function normaliseName(name: string): string {
  return TEAM_NAME_MAP[name] ?? name;
}

type TabId = 'today' | 'group' | 'knockout';

const KNOCKOUT_STAGES = ['LAST_32', 'LAST_16', 'QUARTER_FINALS', 'SEMI_FINALS', 'THIRD_PLACE', 'PLAY_OFF_3RD_PLACE', 'FINAL'];

function isTodayUTC(utcDate: string): boolean {
  const matchDate = new Date(utcDate);
  const now = new Date();
  return (
    matchDate.getUTCFullYear() === now.getUTCFullYear() &&
    matchDate.getUTCMonth() === now.getUTCMonth() &&
    matchDate.getUTCDate() === now.getUTCDate()
  );
}

function formatDateHeader(utcDate: string): string {
  return new Date(utcDate).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function formatKickoff(utcDate: string): string {
  return new Date(utcDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(matchList: FixtureMatch[]): [string, FixtureMatch[]][] {
  const groups: Record<string, FixtureMatch[]> = {};
  for (const m of matchList) {
    const key = formatDateHeader(m.utcDate);
    if (!groups[key]) groups[key] = [];
    groups[key].push(m);
  }
  return Object.entries(groups);
}

function groupByRoundThenDate(matchList: FixtureMatch[]): [string, [string, FixtureMatch[]][]][] {
  const byRound: Record<string, Record<string, FixtureMatch[]>> = {};
  for (const m of matchList) {
    const round = m.stageLabel;
    const date = formatDateHeader(m.utcDate);
    if (!byRound[round]) byRound[round] = {};
    if (!byRound[round][date]) byRound[round][date] = [];
    byRound[round][date].push(m);
  }
  const ROUND_ORDER = ['Round of 32', 'Round of 16', 'Quarter-final', 'Semi-final', '3rd Place Play-off', 'Final'];
  const sortedRounds = Object.keys(byRound).sort(
    (a, b) => (ROUND_ORDER.indexOf(a) === -1 ? 99 : ROUND_ORDER.indexOf(a)) - (ROUND_ORDER.indexOf(b) === -1 ? 99 : ROUND_ORDER.indexOf(b))
  );
  return sortedRounds.map(round => [round, Object.entries(byRound[round])]);
}

interface TeamOwner {
  accentColour: string;
}

interface MatchCardProps {
  match: FixtureMatch;
  homeOwner: TeamOwner | null;
  awayOwner: TeamOwner | null;
  homeFlagEmoji: string;
  awayFlagEmoji: string;
}

function MatchCard({ match, homeOwner, awayOwner, homeFlagEmoji, awayFlagEmoji }: MatchCardProps) {
  const isLive = match.status === 'IN_PLAY' || match.status === 'PAUSED';
  const isDone = match.status === 'FINISHED';
  const hasOwner = homeOwner || awayOwner;
  const ownerColour = homeOwner?.accentColour ?? awayOwner?.accentColour ?? '';

  return (
    <div
      className="card p-3"
      style={
        hasOwner
          ? {
              borderColor: ownerColour + '50',
              background: `linear-gradient(135deg, ${ownerColour}10 0%, #1A2535 60%)`,
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-white/35 text-[10px] uppercase tracking-wider">
          {match.group ? `Group ${match.group}` : match.stageLabel}
          {match.matchday ? ` · MD${match.matchday}` : ''}
        </span>
        {match.venue && (
          <span className="text-white/25 text-[10px] truncate max-w-[140px] text-right">{match.venue}</span>
        )}
      </div>

      <div className="flex items-center gap-1">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <span className="text-lg leading-none">{homeFlagEmoji || '🏳️'}</span>
          <span className="font-semibold text-white text-sm truncate">{normaliseName(match.homeTeam)}</span>
          {homeOwner && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: homeOwner.accentColour }}
            />
          )}
        </div>

        <div className="text-center flex-shrink-0 px-2 min-w-[60px]">
          {isLive && (
            <div className="flex items-center justify-center gap-1">
              <span className="w-1.5 h-1.5 bg-palace-red rounded-full animate-pulse" />
              <span className="text-palace-red font-bold text-xs">LIVE</span>
            </div>
          )}
          {isDone && (
            <span className="font-display font-bold text-xl text-white tabular-nums">
              {match.homeScore} – {match.awayScore}
            </span>
          )}
          {!isLive && !isDone && (
            <span className="text-white/40 text-xs">{formatKickoff(match.utcDate)}</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
          {awayOwner && (
            <span
              className="w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: awayOwner.accentColour }}
            />
          )}
          <span className="font-semibold text-white text-sm truncate text-right">{normaliseName(match.awayTeam)}</span>
          <span className="text-lg leading-none">{awayFlagEmoji || '🏳️'}</span>
        </div>
      </div>
    </div>
  );
}

function StaticSchedule() {
  return (
    <div className="card py-8 text-center space-y-3">
      <Calendar size={40} className="mx-auto text-white/20" />
      <h3 className="font-bold text-white">Live fixtures coming soon</h3>
      <p className="text-white/50 text-sm leading-relaxed">
        Live World Cup fixtures appear here once the feed is available.
        <br />
        <span className="text-gold">Tournament kicks off 11 June 2026.</span>
      </p>
      <div className="mt-4 text-left space-y-1.5 text-sm border-t border-white/10 pt-4">
        {[
          ['Group Stage', 'Jun 11 – Jun 27'],
          ['Round of 32', 'Jun 28 – Jul 3'],
          ['Round of 16', 'Jul 4 – Jul 7'],
          ['Quarter-finals', 'Jul 9 – Jul 11'],
          ['Semi-finals', 'Jul 14 – Jul 15'],
          ['3rd Place', 'Jul 18'],
          ['Final', 'Jul 19 · MetLife Stadium, NJ'],
        ].map(([s, d]) => (
          <div key={s} className="flex justify-between">
            <span className="text-white/60">{s}</span>
            <span className="text-white/30 text-xs">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function FixturesPage() {
  const [matches, setMatches] = useState<FixtureMatch[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('today');
  const [picks, setPicks] = useState<DraftPick[]>([]);
  const [users, setUsers] = useState<GameUser[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [session, setSession] = useState<ReturnType<typeof getSession>>(null);

  useEffect(() => {
    setSession(getSession());
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [fixturesRes, picksRes, usersRes, teamsRes] = await Promise.all([
          fetch('/api/fixtures'),
          supabase.from('draft_picks').select('*'),
          supabase.from('users').select('*'),
          supabase.from('teams').select('*'),
        ]);

        const fixturesData = await fixturesRes.json();
        if (!fixturesRes.ok || fixturesData.error) {
          setError(fixturesData.error ?? 'API_ERROR');
          setMatches([]);
        } else {
          setMatches(fixturesData.matches ?? []);
          setError(null);
        }

        setPicks(picksRes.data ?? []);
        setUsers(usersRes.data ?? []);
        setTeams(teamsRes.data ?? []);
      } catch {
        setError('FETCH_ERROR');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const teamFlagMap = new Map<string, string>();
  for (const t of teams) {
    teamFlagMap.set(t.name.toLowerCase(), t.flag_emoji);
  }

  const ownerMap = new Map<string, GameUser>();
  for (const pick of picks) {
    const user = users.find(u => u.id === pick.user_id);
    if (!user) continue;
    const team = teams.find(t => t.id === pick.team_id);
    if (!team) continue;
    ownerMap.set(team.name.toLowerCase(), user);
  }

  function getOwner(apiTeamName: string): TeamOwner | null {
    const norm = normaliseName(apiTeamName).toLowerCase();
    const user = ownerMap.get(norm);
    if (!user) return null;
    return { accentColour: user.accent_colour };
  }

  function getFlagEmoji(apiTeamName: string): string {
    const norm = normaliseName(apiTeamName).toLowerCase();
    return teamFlagMap.get(norm) ?? '';
  }

  const todayMatches = matches.filter(m => isTodayUTC(m.utcDate));
  const groupMatches = matches.filter(m => m.stage === 'GROUP_STAGE');
  const knockoutMatches = matches.filter(m => KNOCKOUT_STAGES.includes(m.stage));

  const myTeamIdsArray = session
    ? picks.filter(p => p.user_id === session.id).map(p => p.team_id)
    : [];
  const myTeamNamesArray = myTeamIdsArray
    .map(tid => teams.find(t => t.id === tid)?.name.toLowerCase())
    .filter((n): n is string => n != null);
  const myMatchesToday = todayMatches.filter(m => {
    const homeNorm = normaliseName(m.homeTeam).toLowerCase();
    const awayNorm = normaliseName(m.awayTeam).toLowerCase();
    return myTeamNamesArray.includes(homeNorm) || myTeamNamesArray.includes(awayNorm);
  });

  const tabs: { id: TabId; label: string }[] = [
    { id: 'today', label: 'Today' },
    { id: 'group', label: 'Group Stage' },
    { id: 'knockout', label: 'Knockout' },
  ];

  const showStaticSchedule = error === 'NO_KEY' || error === 'NOT_AVAILABLE';

  return (
    <div className="page-fade">
      <div
        className="-mx-4 px-6 py-8 mb-5"
        style={{ background: 'linear-gradient(160deg, #0a1628 0%, #1F3864 50%, #0F1923 100%)' }}
      >
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display font-bold text-5xl text-white leading-none tracking-wide">
              FIXTURES
            </h1>
            <p className="text-white/50 text-sm mt-1.5 uppercase tracking-widest">2026 World Cup</p>
          </div>
          <div className="text-right pt-1">
            <p className="text-white/40 text-xs uppercase tracking-widest">
              {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              tab === t.id
                ? 'bg-palace-red text-white'
                : 'bg-bg-card border border-white/10 text-white/50 hover:text-white/80'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-bg-card rounded-xl animate-pulse" />
          ))}
        </div>
      ) : showStaticSchedule ? (
        <StaticSchedule />
      ) : error ? (
        <div className="card py-6 text-center space-y-3">
          <p className="text-white/50 text-sm">Unable to load fixtures.</p>
          <button
            onClick={() => window.location.reload()}
            className="btn-primary text-sm"
          >
            Retry
          </button>
        </div>
      ) : (
        <>
          {tab === 'today' && (
            <div className="space-y-4">
              {session && myMatchesToday.length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-gold uppercase tracking-widest mb-2">Your Teams</h3>
                  <div className="space-y-2">
                    {myMatchesToday.map(m => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        homeOwner={getOwner(m.homeTeam)}
                        awayOwner={getOwner(m.awayTeam)}
                        homeFlagEmoji={getFlagEmoji(m.homeTeam)}
                        awayFlagEmoji={getFlagEmoji(m.awayTeam)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {todayMatches.length === 0 ? (
                <div className="card py-8 text-center">
                  <p className="text-white/40 text-sm">No matches today.</p>
                </div>
              ) : (
                <div>
                  {session && myMatchesToday.length > 0 && (
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">All Today</h3>
                  )}
                  <div className="space-y-2">
                    {todayMatches.map(m => (
                      <MatchCard
                        key={m.id}
                        match={m}
                        homeOwner={getOwner(m.homeTeam)}
                        awayOwner={getOwner(m.awayTeam)}
                        homeFlagEmoji={getFlagEmoji(m.homeTeam)}
                        awayFlagEmoji={getFlagEmoji(m.awayTeam)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === 'group' && (
            <div className="space-y-4">
              {groupMatches.length === 0 ? (
                <div className="card py-8 text-center">
                  <p className="text-white/40 text-sm">No group stage fixtures available yet.</p>
                </div>
              ) : (
                groupByDate(groupMatches).map(([date, dayMatches]) => (
                  <div key={date}>
                    <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{date}</h3>
                    <div className="space-y-2">
                      {dayMatches.map(m => (
                        <MatchCard
                          key={m.id}
                          match={m}
                          homeOwner={getOwner(m.homeTeam)}
                          awayOwner={getOwner(m.awayTeam)}
                          homeFlagEmoji={getFlagEmoji(m.homeTeam)}
                          awayFlagEmoji={getFlagEmoji(m.awayTeam)}
                        />
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {tab === 'knockout' && (
            <div className="space-y-6">
              {knockoutMatches.length === 0 ? (
                <div className="card py-8 text-center">
                  <p className="text-white/40 text-sm">Knockout fixtures coming soon.</p>
                </div>
              ) : (
                groupByRoundThenDate(knockoutMatches).map(([round, dateGroups]) => (
                  <div key={round}>
                    <h2 className="font-display font-bold text-xl text-white uppercase tracking-wider mb-3">
                      {round}
                    </h2>
                    <div className="space-y-4">
                      {dateGroups.map(([date, dayMatches]) => (
                        <div key={date}>
                          <h3 className="text-xs font-bold text-white/40 uppercase tracking-widest mb-2">{date}</h3>
                          <div className="space-y-2">
                            {dayMatches.map(m => (
                              <MatchCard
                                key={m.id}
                                match={m}
                                homeOwner={getOwner(m.homeTeam)}
                                awayOwner={getOwner(m.awayTeam)}
                                homeFlagEmoji={getFlagEmoji(m.homeTeam)}
                                awayFlagEmoji={getFlagEmoji(m.awayTeam)}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

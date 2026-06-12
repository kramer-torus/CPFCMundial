'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

// Normalise football-data.org team names to match our DB
const FD_NAME_MAP: Record<string, string> = {
  'IR Iran': 'Iran',
  'Korea Republic': 'South Korea',
  'USA': 'United States',
  "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast',
  'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Czech Republic': 'Czechia',
  'Cape Verde Islands': 'Cape Verde',
  'Curaçao': 'Curacao',
  'Congo DR': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
  'Republic of Congo': 'DR Congo',
};

function normName(name: string): string {
  return (FD_NAME_MAP[name] ?? name).toLowerCase();
}

interface Chip {
  key: string;
  playerName: string;
  accentColour: string;
  teamFlag: string;
  teamName: string;
  oppFlag: string;
  oppName: string;
  dateLabel: string;
  isLive: boolean;
}

function fmtDate(utcDate: string): string {
  const d = new Date(utcDate);
  const now = new Date();
  const tom = new Date(now); tom.setDate(tom.getDate() + 1);
  const day = d.toDateString() === now.toDateString() ? 'Today'
    : d.toDateString() === tom.toDateString() ? 'Tomorrow'
    : d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${day} · ${time}`;
}

export default function FixtureTicker() {
  const [chips, setChips] = useState<Chip[]>([]);

  useEffect(() => {
    async function load() {
      const [fdRes, picksRes, teamsRes, usersRes] = await Promise.all([
        fetch('/api/fixtures').then(r => r.json()).catch(() => ({ matches: [] })),
        supabase.from('draft_picks').select('user_id, team_id'),
        supabase.from('teams').select('id, name, flag_emoji'),
        supabase.from('users').select('id, display_name, accent_colour'),
      ]);

      const matches: { id: number; status: string; utcDate: string; homeTeam: string; awayTeam: string }[] =
        fdRes.matches ?? [];
      const picks: { user_id: string; team_id: string }[] = picksRes.data ?? [];
      const teams: { id: string; name: string; flag_emoji: string }[] = teamsRes.data ?? [];
      const users: { id: string; display_name: string; accent_colour: string }[] = usersRes.data ?? [];

      // Build normalised-name → { flag, ownerId }
      const meta = new Map<string, { flag: string; ownerId: string | null; canonicalName: string }>();
      for (const t of teams) {
        const pick = picks.find(p => p.team_id === t.id);
        meta.set(t.name.toLowerCase(), { flag: t.flag_emoji, ownerId: pick?.user_id ?? null, canonicalName: t.name });
      }
      const userById = new Map(users.map(u => [u.id, u]));

      const result: Chip[] = [];
      const upcoming = matches
        .filter(m => ['SCHEDULED', 'TIMED', 'IN_PLAY'].includes(m.status))
        .sort((a, b) => new Date(a.utcDate).getTime() - new Date(b.utcDate).getTime())
        .slice(0, 30);

      for (const m of upcoming) {
        const hk = normName(m.homeTeam);
        const ak = normName(m.awayTeam);
        const hm = meta.get(hk);
        const am = meta.get(ak);
        if (!hm?.ownerId && !am?.ownerId) continue;

        const isLive = m.status === 'IN_PLAY';
        const dateLabel = fmtDate(m.utcDate);

        if (hm?.ownerId) {
          const u = userById.get(hm.ownerId);
          if (u) result.push({ key: `${m.id}-h`, playerName: u.display_name, accentColour: u.accent_colour,
            teamFlag: hm.flag, teamName: hm.canonicalName, oppFlag: am?.flag ?? '🏳️', oppName: am?.canonicalName ?? (FD_NAME_MAP[m.awayTeam] ?? m.awayTeam),
            dateLabel, isLive });
        }
        if (am?.ownerId) {
          const u = userById.get(am.ownerId);
          if (u) result.push({ key: `${m.id}-a`, playerName: u.display_name, accentColour: u.accent_colour,
            teamFlag: am.flag, teamName: am.canonicalName, oppFlag: hm?.flag ?? '🏳️', oppName: hm?.canonicalName ?? (FD_NAME_MAP[m.homeTeam] ?? m.homeTeam),
            dateLabel, isLive });
        }
      }

      setChips(result);
    }
    load();
  }, []);

  if (!chips.length) return null;

  const doubled = [...chips, ...chips];
  const dur = Math.max(25, chips.length * 4);

  return (
    <div className="ticker-wrap -mx-4 overflow-hidden border-b border-white/8 bg-white/[0.03] mb-5">
      <div
        className="ticker-track flex items-stretch"
        style={{ width: 'max-content', '--ticker-dur': `${dur}s` } as React.CSSProperties}
      >
        {doubled.map((chip, i) => (
          <div
            key={`${chip.key}-${i}`}
            className="flex items-center gap-2 px-4 py-2.5 border-r border-white/8 flex-shrink-0"
          >
            {chip.isLive
              ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
              : <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: chip.accentColour }} />
            }
            <div className="text-xs whitespace-nowrap">
              <span className="font-semibold" style={{ color: chip.accentColour }}>{chip.playerName}</span>
              <span className="text-white/35"> · </span>
              <span className="text-white font-medium">{chip.teamFlag} {chip.teamName}</span>
              <span className="text-white/50"> vs {chip.oppFlag} {chip.oppName}</span>
              {chip.isLive
                ? <span className="ml-2 text-[10px] font-bold text-emerald-400 tracking-wider">LIVE</span>
                : <span className="text-white/30"> · {chip.dateLabel}</span>
              }
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

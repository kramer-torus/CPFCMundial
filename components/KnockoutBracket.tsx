'use client';

import { useMemo } from 'react';
import type { FixtureMatch } from '@/app/api/fixtures/route';
import type { Team } from '@/lib/types';

export interface OwnerInfo { displayName: string; colour: string; }

interface Props {
  matches: FixtureMatch[];
  ownerMap: Map<string, OwnerInfo>; // key: DB team name, lowercase
  teams: Team[];
}

const BRACKET_ROUNDS = [
  { stage: 'LAST_32',        label: 'R32',   count: 16 },
  { stage: 'LAST_16',        label: 'R16',   count: 8  },
  { stage: 'QUARTER_FINALS', label: 'QF',    count: 4  },
  { stage: 'SEMI_FINALS',    label: 'SF',    count: 2  },
  { stage: 'FINAL',          label: 'Final', count: 1  },
] as const;

const TEAM_NAME_MAP: Record<string, string> = {
  'IR Iran': 'Iran', 'Korea Republic': 'South Korea',
  'USA': 'United States', "Côte d'Ivoire": 'Ivory Coast',
  "Cote d'Ivoire": 'Ivory Coast', 'Bosnia-Herzegovina': 'Bosnia & Herzegovina',
  'Czech Republic': 'Czechia', 'Cape Verde Islands': 'Cape Verde',
  'Curaçao': 'Curacao', 'Congo DR': 'DR Congo',
  'Democratic Republic of Congo': 'DR Congo',
};
const norm = (n: string) => TEAM_NAME_MAP[n] ?? n;

const CARD_H = 62;
const GAP = 8;
const SLOT = CARD_H + GAP; // 70px per bracket slot
const COL_W = 150;
const CONN_W = 22;
const LINE = '#1E3050';

function TeamRow({ name, score, won, owner, flag }: {
  name: string; score: number | null; won: boolean;
  owner?: OwnerInfo; flag?: string;
}) {
  const tbd = !name || name.length < 2;
  const played = score !== null;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', height: '50%',
      padding: '2px 7px 2px 6px', gap: 4,
      opacity: played && !won ? 0.4 : 1,
      transition: 'opacity 0.2s',
    }}>
      {flag && !tbd && (
        <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{flag}</span>
      )}
      <span style={{
        flex: 1, fontSize: 10, lineHeight: '13px',
        fontWeight: won ? 700 : 400,
        color: tbd ? '#2D4060' : won ? '#F9FAFB' : '#7A9BB8',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {tbd ? '—' : name}
      </span>
      {owner && !tbd && (
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: owner.colour, flexShrink: 0, display: 'block' }} />
      )}
      {played && (
        <span style={{
          fontSize: 11, fontWeight: 700, flexShrink: 0, minWidth: 14, textAlign: 'right',
          color: won ? 'white' : '#3B5470',
        }}>
          {score}
        </span>
      )}
    </div>
  );
}

function BracketCard({ m, ownerMap, flagMap }: {
  m: FixtureMatch | null;
  ownerMap: Map<string, OwnerInfo>;
  flagMap: Map<string, string>;
}) {
  const base: React.CSSProperties = {
    width: COL_W, height: CARD_H,
    background: '#0A1420',
    border: '1px solid #12253A',
    borderRadius: 5, display: 'flex', flexDirection: 'column', overflow: 'hidden',
    flexShrink: 0,
  };

  if (!m) {
    return (
      <div style={{ ...base, borderLeft: '3px solid #12253A' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: 10, color: '#1E3050' }}>TBD</span>
        </div>
        <div style={{ height: 1, background: '#12253A' }} />
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 8px' }}>
          <span style={{ fontSize: 10, color: '#1E3050' }}>TBD</span>
        </div>
      </div>
    );
  }

  const home = norm(m.homeTeam);
  const away = norm(m.awayTeam);
  const homeOwner = ownerMap.get(home.toLowerCase());
  const awayOwner = ownerMap.get(away.toLowerCase());
  const accent = (homeOwner ?? awayOwner)?.colour ?? '#12253A';
  const homeWon = m.winner === 'HOME_TEAM';
  const awayWon = m.winner === 'AWAY_TEAM';
  const homeDraft = homeOwner || awayOwner; // at least one drafted team in match

  return (
    <div style={{
      ...base,
      borderColor: homeDraft ? accent + '55' : '#12253A',
      borderLeft: `3px solid ${homeDraft ? accent : '#12253A'}`,
    }}>
      <TeamRow
        name={home} score={m.homeScore} won={homeWon}
        owner={homeOwner}
        flag={flagMap.get(home.toLowerCase())}
      />
      <div style={{ height: 1, background: '#12253A', flexShrink: 0 }} />
      <TeamRow
        name={away} score={m.awayScore} won={awayWon}
        owner={awayOwner}
        flag={flagMap.get(away.toLowerCase())}
      />
    </div>
  );
}

export default function KnockoutBracket({ matches, ownerMap, teams }: Props) {
  const flagMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const t of teams) m.set(t.name.toLowerCase(), t.flag_emoji);
    return m;
  }, [teams]);

  const byRound = useMemo(() => {
    const map = new Map<string, FixtureMatch[]>();
    for (const r of BRACKET_ROUNDS) {
      map.set(r.stage, matches.filter(m => m.stage === r.stage).sort((a, b) => a.id - b.id));
    }
    map.set('3PO', matches.filter(m =>
      m.stage === 'THIRD_PLACE' || m.stage === 'PLAY_OFF_3RD_PLACE'
    ).sort((a, b) => a.id - b.id));
    return map;
  }, [matches]);

  const maxSlots = 16; // R32 always anchors the height
  const totalH = maxSlots * SLOT - GAP; // 1112px

  // Total bracket width
  const totalW = BRACKET_ROUNDS.length * COL_W + (BRACKET_ROUNDS.length - 1) * CONN_W;

  const tpo = byRound.get('3PO') ?? [];

  return (
    <div>
      {/* Player colour legend */}
      {ownerMap.size > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', marginBottom: 12 }}>
          {Array.from(new Map(
            Array.from(ownerMap.values()).map(o => [o.colour, o])
          ).values()).map(o => (
            <div key={o.colour} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: o.colour, display: 'block' }} />
              <span style={{ fontSize: 11, color: '#7A9BB8' }}>{o.displayName}</span>
            </div>
          ))}
        </div>
      )}

      {/* Scrollable bracket */}
      <div style={{ overflowX: 'auto', overflowY: 'visible', WebkitOverflowScrolling: 'touch' as never, marginLeft: -16, marginRight: -16 }}>
        <div style={{ paddingLeft: 16, paddingRight: 16 }}>
          {/* Round header labels */}
          <div style={{ display: 'flex', gap: 0, marginBottom: 10, width: totalW }}>
            {BRACKET_ROUNDS.map((r, i) => (
              <div key={r.stage} style={{ display: 'flex', flexShrink: 0 }}>
                <div style={{ width: COL_W, textAlign: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#3B5470', letterSpacing: 1 }}>{r.label}</span>
                </div>
                {i < BRACKET_ROUNDS.length - 1 && <div style={{ width: CONN_W }} />}
              </div>
            ))}
          </div>

          {/* Bracket tree */}
          <div style={{ position: 'relative', height: totalH, width: totalW }}>
            {BRACKET_ROUNDS.map((round, roundIdx) => {
              const ms = byRound.get(round.stage) ?? [];
              const slotsPerMatch = maxSlots / round.count; // 1, 2, 4, 8, 16
              const slotH = slotsPerMatch * SLOT;
              const cardOffset = (slotH - CARD_H) / 2;
              const colLeft = roundIdx * (COL_W + CONN_W);

              return (
                <div key={round.stage}>
                  {/* Match cards */}
                  {Array.from({ length: round.count }, (_, i) => (
                    <div key={i} style={{ position: 'absolute', left: colLeft, top: i * slotH + cardOffset }}>
                      <BracketCard m={ms[i] ?? null} ownerMap={ownerMap} flagMap={flagMap} />
                    </div>
                  ))}

                  {/* Connector lines to next round */}
                  {roundIdx < BRACKET_ROUNDS.length - 1 &&
                    Array.from({ length: round.count / 2 }, (_, pairIdx) => {
                      const y1 = pairIdx * 2 * slotH + cardOffset + CARD_H / 2;
                      const y2 = (pairIdx * 2 + 1) * slotH + cardOffset + CARD_H / 2;
                      const midY = (y1 + y2) / 2;
                      const lx = colLeft + COL_W;
                      const mid = lx + CONN_W / 2;
                      return (
                        <div key={pairIdx}>
                          {/* h-line out from top card */}
                          <div style={{ position: 'absolute', left: lx, top: y1 - 0.5, width: CONN_W / 2, height: 1, background: LINE }} />
                          {/* h-line out from bottom card */}
                          <div style={{ position: 'absolute', left: lx, top: y2 - 0.5, width: CONN_W / 2, height: 1, background: LINE }} />
                          {/* v-line connecting them */}
                          <div style={{ position: 'absolute', left: mid - 1, top: y1, width: 1, height: y2 - y1, background: LINE }} />
                          {/* h-line to next round */}
                          <div style={{ position: 'absolute', left: mid, top: midY - 0.5, width: CONN_W / 2, height: 1, background: LINE }} />
                        </div>
                      );
                    })
                  }
                </div>
              );
            })}
          </div>

          {/* 3rd Place match */}
          {tpo.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#3B5470', letterSpacing: 1, marginBottom: 8 }}>
                3RD PLACE
              </div>
              <BracketCard m={tpo[0]} ownerMap={ownerMap} flagMap={flagMap} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

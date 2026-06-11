import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { GameUser, DraftPick, Team, TeamPoints } from '@/lib/types';
import {
  computeStandings,
  buildBulletinData,
  snapshotFromStandings,
  StandingsSnapshotEntry,
  BulletinData,
} from '@/lib/standings';
import { sendRawWhatsApp } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

function authorize(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // no secret configured → open (matches sync-scores behaviour)
  const header = req.headers.get('authorization') ?? req.nextUrl.searchParams.get('secret') ?? '';
  const provided = header.startsWith('Bearer ') ? header.slice(7) : header;
  return provided === secret;
}

function buildPrompt(data: BulletinData, bulletinNumber: number): string {
  const board = data.standings
    .map(s => {
      const squad = s.teams
        .map(t => `${t.flag} ${t.name} ${t.points}pt${t.eliminated ? ' (OUT)' : ''}`)
        .join(', ');
      return `${s.rank}. ${s.display_name} — ${s.points} pts, ${s.teams_alive} teams alive, best run: ${s.best_stage}\n   squad: ${squad}`;
    })
    .join('\n');

  const movers = data.movers
    .filter(m => m.gained !== 0)
    .map(m => {
      const move = m.prev_rank && m.prev_rank !== m.rank
        ? ` (moved ${m.prev_rank > m.rank ? 'up' : 'down'} from ${m.prev_rank} to ${m.rank})`
        : '';
      return `${m.display_name}: +${m.gained} pts since the last wrap${move}`;
    })
    .join('\n');

  return `You are the resident pundit for "CPFCMundial", a 2026 World Cup draft game played by 6 Crystal Palace FC supporters (club motto: "Glad All Over"). Each player drafted 8 national teams and earns points as those teams win and advance. Scoring: group-stage win 3 / draw 1; knockout win 3; 3rd-place playoff win 2; final winner 5 / runner-up 3.

Write Daily Wrap #${bulletinNumber}: a punchy, funny, banter-heavy round-up the players read in the app each day. Friendly ribbing of whoever's losing, hyping whoever's surging. British football-banter tone.

CURRENT STANDINGS:
${board}

POINTS MOVEMENT SINCE THE LAST WRAP:
${movers || '(no change since the last wrap — call that out / stir the pot)'}

TOURNAMENT CONTEXT:
Rounds with results so far: ${data.roundsPlayed.join(', ') || 'none yet — tournament has not kicked off'}
Furthest stage reached by any drafted team: ${data.latestStage ?? 'n/a'}

FORMATTING RULES:
- Use *single asterisks* for bold (WhatsApp-style — the wrap can also be shared to WhatsApp), NOT **double**.
- Short lines, generous emoji, ━ divider lines between sections.
- Start with a title line like "🏆 *CPFC MUNDIAL — DAILY WRAP #${bulletinNumber}*".
- Include: a one-line hook, the standings (with 🥇🥈🥉 for the top three), a "movers" callout, one or two specific banter lines about named players/teams, and a short sign-off ending with "Glad All Over the World 🦅".
- Keep it tight — readable on a phone in 20 seconds.
- Output ONLY the message body. No preamble, no explanation, no code fences.`;
}

function fallbackBody(data: BulletinData, bulletinNumber: number): string {
  const lines = data.standings
    .map((s, i) => `${['🥇', '🥈', '🥉'][i] ?? `${i + 1}.`} ${s.display_name} — ${s.points} pts (${s.teams_alive} alive)`)
    .join('\n');
  return `🏆 *CPFC MUNDIAL — DAILY WRAP #${bulletinNumber}*\nGlad All Over the World 🦅\n\n*STANDINGS*\n${lines}`;
}

export async function GET(req: NextRequest) {
  if (!authorize(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminClient();

  // Best-effort: refresh scores first so the bulletin reflects the latest results.
  // Non-fatal — if it fails (or is rate-limited) we still report on current DB state.
  try {
    const origin = req.nextUrl.origin;
    const secret = process.env.CRON_SECRET;
    await fetch(`${origin}/api/sync-scores${secret ? `?secret=${encodeURIComponent(secret)}` : ''}`, {
      cache: 'no-store',
    });
  } catch {
    // ignore — proceed with whatever is in the DB
  }

  const [usersRes, picksRes, teamsRes, pointsRes, lastBulletinRes] = await Promise.all([
    db.from('users').select('*').order('display_name'),
    db.from('draft_picks').select('*'),
    db.from('teams').select('*'),
    db.from('team_points').select('*'),
    db.from('bulletins').select('id, stats_json, created_at').order('created_at', { ascending: false }).limit(1),
  ]);

  const users = (usersRes.data || []) as GameUser[];
  const picks = (picksRes.data || []) as DraftPick[];
  const teams = (teamsRes.data || []) as Team[];
  const points = (pointsRes.data || []) as TeamPoints[];

  if (users.length === 0 || picks.length === 0) {
    return NextResponse.json({ error: 'No draft data — nothing to report on yet.' }, { status: 400 });
  }

  const prevSnapshot: StandingsSnapshotEntry[] = (lastBulletinRes.data?.[0]?.stats_json as StandingsSnapshotEntry[]) ?? [];
  const bulletinNumber = ((await db.from('bulletins').select('id', { count: 'exact', head: true })).count ?? 0) + 1;

  const standings = computeStandings(users, picks, teams, points);
  const data = buildBulletinData(standings, points, prevSnapshot);

  // Generate the banter with Claude. Fall back to a plain template if the API is unavailable.
  let body: string;
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    try {
      const anthropic = new Anthropic({ apiKey });
      const message = await anthropic.messages.create({
        model: 'claude-opus-4-8',
        max_tokens: 2000,
        messages: [{ role: 'user', content: buildPrompt(data, bulletinNumber) }],
      });
      const text = message.content.find(b => b.type === 'text');
      body = text && 'text' in text ? text.text.trim() : fallbackBody(data, bulletinNumber);
    } catch {
      body = fallbackBody(data, bulletinNumber);
    }
  } else {
    body = fallbackBody(data, bulletinNumber);
  }

  const title = data.latestStage ? `Daily Wrap #${bulletinNumber} · ${data.latestStage}` : `Daily Wrap #${bulletinNumber}`;
  const snapshot = snapshotFromStandings(standings);

  const { data: inserted, error: insertErr } = await db
    .from('bulletins')
    .insert({ title, body, stats_json: snapshot })
    .select('id')
    .single();

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Push: nudge the admin's WhatsApp that a fresh bulletin is ready to forward to the group.
  // Best-effort and only if WhatsApp is configured.
  let nudged = false;
  try {
    const { data: admin } = await db
      .from('users')
      .select('phone_number')
      .eq('is_admin', true)
      .not('phone_number', 'is', null)
      .limit(1)
      .maybeSingle();
    if (admin?.phone_number) {
      nudged = await sendRawWhatsApp(
        admin.phone_number,
        `📋 *CPFCMundial — ${title} is live!*\n\nRead it in the app:\nhttps://cpfc-mundial.vercel.app/bulletin`,
      );
    }
  } catch {
    // ignore — the bulletin is saved regardless
  }

  return NextResponse.json({ ok: true, id: inserted?.id, bulletinNumber, nudged, generatedWithLLM: !!apiKey });
}

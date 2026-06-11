import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GameUser, DraftPick, Team, TeamPoints } from '@/lib/types';
import {
  computeStandings,
  buildBulletinData,
  snapshotFromStandings,
  StandingsSnapshotEntry,
} from '@/lib/standings';
import { generateWrapBody, DAILY_WRAP_ACTION, WrapDetail } from '@/lib/wrap';
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

export async function GET(req: NextRequest) {
  if (!authorize(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getAdminClient();

  // Best-effort: refresh scores first so the wrap reflects the latest results.
  // Non-fatal — if it fails (or is rate-limited) we report on current DB state.
  try {
    const origin = req.nextUrl.origin;
    const secret = process.env.CRON_SECRET;
    await fetch(`${origin}/api/sync-scores${secret ? `?secret=${encodeURIComponent(secret)}` : ''}`, {
      cache: 'no-store',
    });
  } catch {
    // ignore — proceed with whatever is in the DB
  }

  const [usersRes, picksRes, teamsRes, pointsRes, lastWrapRes] = await Promise.all([
    db.from('users').select('*').order('display_name'),
    db.from('draft_picks').select('*'),
    db.from('teams').select('*'),
    db.from('team_points').select('*'),
    db.from('audit_log').select('detail, created_at').eq('action', DAILY_WRAP_ACTION).order('created_at', { ascending: false }).limit(1),
  ]);

  const users = (usersRes.data || []) as GameUser[];
  const picks = (picksRes.data || []) as DraftPick[];
  const teams = (teamsRes.data || []) as Team[];
  const points = (pointsRes.data || []) as TeamPoints[];

  if (users.length === 0 || picks.length === 0) {
    return NextResponse.json({ error: 'No draft data — nothing to report on yet.' }, { status: 400 });
  }

  // Previous snapshot (for movers) lives in the last wrap's JSON detail.
  let prevSnapshot: StandingsSnapshotEntry[] = [];
  try {
    const prevDetail = lastWrapRes.data?.[0]?.detail;
    if (prevDetail) {
      const parsed = JSON.parse(prevDetail) as WrapDetail;
      prevSnapshot = parsed.snapshot ?? [];
    }
  } catch {
    // older/free-form audit rows — ignore
  }

  const { count } = await db
    .from('audit_log')
    .select('id', { count: 'exact', head: true })
    .eq('action', DAILY_WRAP_ACTION);
  const wrapNumber = (count ?? 0) + 1;

  const standings = computeStandings(users, picks, teams, points);
  const data = buildBulletinData(standings, points, prevSnapshot);

  const body = generateWrapBody(data, wrapNumber);
  const title = data.latestStage ? `Daily Wrap #${wrapNumber} · ${data.latestStage}` : `Daily Wrap #${wrapNumber}`;
  const snapshot = snapshotFromStandings(standings);

  const detail: WrapDetail = { title, body, snapshot };
  const adminId = users.find(u => u.is_admin)?.id ?? null;

  const { error: insertErr } = await db
    .from('audit_log')
    .insert({ user_id: adminId, action: DAILY_WRAP_ACTION, detail: JSON.stringify(detail) });

  if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });

  // Optional push: nudge the admin's WhatsApp that a fresh wrap is live (only if configured).
  let nudged = false;
  try {
    const admin = users.find(u => u.is_admin && u.phone_number);
    if (admin?.phone_number) {
      nudged = await sendRawWhatsApp(
        admin.phone_number,
        `📋 *CPFCMundial — ${title} is live!*\n\nRead it in the app:\nhttps://cpfc-mundial.vercel.app/bulletin`,
      );
    }
  } catch {
    // ignore — the wrap is saved regardless
  }

  return NextResponse.json({ ok: true, wrapNumber, nudged });
}

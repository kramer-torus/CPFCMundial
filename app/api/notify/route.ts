import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { notifyDraftTurn, sendQuizReminder, buildLeaderboardMessage, sendRawWhatsApp } from '@/lib/whatsapp';

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  return createClient(url, key);
}

export async function POST(req: NextRequest) {
  if (!process.env.WHATSAPP_TOKEN || !process.env.WHATSAPP_PHONE_ID) {
    return NextResponse.json({ ok: false, error: 'WhatsApp not configured' }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body?.type) return NextResponse.json({ ok: false, error: 'Missing type' }, { status: 400 });

  const db = getAdminClient();

  if (body.type === 'draft_turn') {
    // { type: 'draft_turn', userId: string, pickNumber: number, tier: number }
    const { data: user } = await db.from('users').select('display_name, phone_number').eq('id', body.userId).single();
    if (!user?.phone_number) return NextResponse.json({ ok: false, error: 'No phone number' });
    await notifyDraftTurn(user.display_name, user.phone_number, body.pickNumber, body.tier);
    return NextResponse.json({ ok: true });
  }

  if (body.type === 'quiz_reminder') {
    // { type: 'quiz_reminder' } — sends to all players who haven't completed the quiz
    const [{ data: users }, { data: results }] = await Promise.all([
      db.from('users').select('id, display_name, phone_number'),
      db.from('quiz_results').select('user_id'),
    ]);
    const doneIds = new Set((results || []).map((r: { user_id: string }) => r.user_id));
    const pending = (users || []).filter((u: { id: string; phone_number?: string }) => !doneIds.has(u.id) && u.phone_number);
    await Promise.all(pending.map((u: { display_name: string; phone_number: string }) => sendQuizReminder(u.display_name, u.phone_number)));
    return NextResponse.json({ ok: true, sent: pending.length });
  }

  if (body.type === 'leaderboard') {
    // { type: 'leaderboard', board: [{name, pts, alive}] }
    const { data: users } = await db.from('users').select('phone_number');
    const phones = (users || []).map((u: { phone_number?: string }) => u.phone_number).filter(Boolean) as string[];
    const message = buildLeaderboardMessage(body.board || []);
    await Promise.all(phones.map(phone => sendRawWhatsApp(phone, message)));
    return NextResponse.json({ ok: true, sent: phones.length });
  }

  return NextResponse.json({ ok: false, error: 'Unknown type' }, { status: 400 });
}

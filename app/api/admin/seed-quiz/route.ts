import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const { pin, user_name, score, correct_count, completed_at } = body;

  if (String(pin) !== String(process.env.NEXT_PUBLIC_ADMIN_PIN)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: users, error: userErr } = await supabase
    .from('users')
    .select('id, display_name')
    .ilike('display_name', `%${user_name}%`);

  if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 });
  if (!users || users.length === 0) return NextResponse.json({ error: 'User not found', user_name }, { status: 404 });
  if (users.length > 1) return NextResponse.json({ error: 'Multiple matches', users }, { status: 400 });

  const user = users[0];

  const { error: upsertErr } = await supabase.from('quiz_results').upsert(
    {
      user_id: user.id,
      score,
      correct_count,
      completed_at: completed_at ?? new Date().toISOString(),
    },
    { onConflict: 'user_id' }
  );

  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 });

  return NextResponse.json({ ok: true, user, score, correct_count });
}

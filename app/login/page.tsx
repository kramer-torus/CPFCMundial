'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { hashPin, setSession, getSession } from '@/lib/auth';
import type { GameUser } from '@/lib/types';

const PLAYERS = [
  { name: 'Kev', colour: '#C4122E' },
  { name: 'Franks', colour: '#3B82F6' },
  { name: 'Kangars', colour: '#C9A84C' },
  { name: 'Jakob', colour: '#10B981' },
];

export default function LoginPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<typeof PLAYERS[0] | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (getSession()) router.replace('/');
  }, [router]);

  async function handleLogin() {
    if (!selected || pin.length < 4) return;
    setLoading(true);
    setError('');
    const hashed = await hashPin(pin);
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('display_name', selected.name)
      .single();
    setLoading(false);
    if (!data || data.pin_hash !== hashed) {
      setError('Incorrect PIN');
      setPin('');
      setTimeout(() => setError(''), 2000);
      return;
    }
    const user = data as GameUser;
    setSession({ id: user.id, display_name: user.display_name, is_admin: user.is_admin, accent_colour: user.accent_colour });
    window.dispatchEvent(new Event('cpfc-session-change'));
    router.replace('/');
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6">
        <button onClick={() => { setSelected(null); setPin(''); setError(''); }} className="self-start text-white/40 hover:text-white mb-6 text-sm">← Back</button>
        <div className="text-4xl mb-3">🦅</div>
        <h2 className="text-2xl font-extrabold mb-1" style={{ color: selected.colour }}>{selected.name}</h2>
        <p className="text-white/50 text-sm mb-8">Enter your PIN</p>
        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="w-48 bg-white/10 border border-white/20 rounded-xl p-3 text-center text-3xl tracking-widest text-white mb-2 focus:outline-none focus:border-gold"
          placeholder="••••"
          autoFocus
        />
        {error && <p className="text-palace-red text-sm mb-3">{error}</p>}
        {!error && <div className="h-5 mb-3" />}
        <button
          onClick={handleLogin}
          disabled={loading || pin.length < 4}
          className="w-48 btn-primary disabled:opacity-40 flex items-center justify-center gap-2"
          style={{ backgroundColor: loading || pin.length < 4 ? undefined : selected.colour }}
        >
          {loading ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Enter'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-base flex flex-col items-center justify-center p-6">
      <div className="text-6xl mb-3">🦅</div>
      <h1 className="text-3xl font-extrabold mb-1">
        <span className="text-palace-red">CPFC</span>Mundial
      </h1>
      <p className="text-gold italic text-sm mb-10">Glad All Over the World</p>
      <p className="text-white/50 text-xs mb-4 uppercase tracking-widest">Who are you?</p>
      <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
        {PLAYERS.map(p => (
          <button
            key={p.name}
            onClick={() => setSelected(p)}
            className="card flex flex-col items-center gap-2 py-5 hover:bg-white/10 active:scale-95 transition-all"
            style={{ borderLeftColor: p.colour, borderLeftWidth: 3 }}
          >
            <span className="text-2xl">🦅</span>
            <span className="font-bold text-white text-lg">{p.name}</span>
            <span className="text-white/30 text-xs">Enter PIN →</span>
          </button>
        ))}
      </div>
    </div>
  );
}

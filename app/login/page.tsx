'use client';
export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { hashPin, setSession, getSession } from '@/lib/auth';
import type { GameUser } from '@/lib/types';

const PLAYERS = [
  { name: 'Kev',          colour: '#C4122E' },
  { name: 'Franks',       colour: '#3B82F6' },
  { name: 'Kangars',      colour: '#C9A84C' },
  { name: 'Jakob',        colour: '#10B981' },
  { name: 'Matty Eagles', colour: '#F97316' },
  { name: 'Bananaman',    colour: '#A855F7' },
];

function initials(name: string) {
  return name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

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
      <div className="fixed inset-0 bg-bg-base flex flex-col items-center justify-center p-6 z-50">
        <button
          onClick={() => { setSelected(null); setPin(''); setError(''); }}
          className="absolute top-6 left-6 text-white/40 hover:text-white text-sm flex items-center gap-1 transition-colors"
        >
          ← Back
        </button>

        {/* Avatar */}
        <div
          className="w-24 h-24 rounded-2xl flex items-center justify-center mb-5 shadow-2xl"
          style={{ backgroundColor: selected.colour }}
        >
          <span className="font-display font-bold text-4xl text-white">{initials(selected.name)}</span>
        </div>

        <h2 className="font-display font-bold text-4xl text-white mb-1 tracking-wide" style={{ color: selected.colour }}>
          {selected.name.toUpperCase()}
        </h2>
        <p className="text-white/40 text-sm mb-8 tracking-widest uppercase">Enter PIN</p>

        <input
          type="password"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={e => { setPin(e.target.value); setError(''); }}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          className="w-48 bg-white/8 border-2 rounded-2xl p-4 text-center text-3xl tracking-[0.5em] text-white mb-2 focus:outline-none transition-colors"
          style={{ borderColor: pin.length >= 4 ? selected.colour : 'rgba(255,255,255,0.15)' }}
          placeholder="····"
          autoFocus
        />
        {error && <p className="text-palace-red text-sm mb-3 font-semibold">{error}</p>}
        {!error && <div className="h-5 mb-3" />}
        <button
          onClick={handleLogin}
          disabled={loading || pin.length < 4}
          className="w-48 font-display font-bold text-lg py-3.5 rounded-2xl transition-all disabled:opacity-30 flex items-center justify-center gap-2 uppercase tracking-wider"
          style={{ backgroundColor: selected.colour, color: 'white' }}
        >
          {loading
            ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            : 'Enter →'
          }
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex flex-col overflow-hidden" style={{ background: 'radial-gradient(ellipse at 50% 0%, #3d0a14 0%, #0F1923 60%)' }}>
      {/* Header */}
      <div className="flex flex-col items-center pt-12 pb-6 px-6 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-palace-red rounded-xl flex items-center justify-center shadow-lg shadow-palace-red/30">
            <span className="text-xl">🦅</span>
          </div>
          <div>
            <h1 className="font-display font-bold text-3xl text-white leading-none tracking-wide">
              CPFC<span className="text-gold">Mundial</span>
            </h1>
            <p className="text-white/40 text-xs italic">Glad All Over the World</p>
          </div>
        </div>
      </div>

      {/* Player grid */}
      <div className="flex-1 overflow-y-auto px-5 pb-8">
        <p className="text-center text-white/30 text-xs font-bold uppercase tracking-[0.3em] mb-4">Who are you?</p>
        <div className="grid grid-cols-2 gap-3">
          {PLAYERS.map(p => (
            <button
              key={p.name}
              onClick={() => setSelected(p)}
              className="relative overflow-hidden rounded-2xl p-4 flex flex-col items-center gap-3 active:scale-95 transition-all group"
              style={{ background: `linear-gradient(135deg, ${p.colour}22 0%, ${p.colour}08 100%)`, borderWidth: 1, borderColor: `${p.colour}40` }}
            >
              {/* Top accent bar */}
              <div className="absolute top-0 left-0 right-0 h-0.5" style={{ backgroundColor: p.colour }} />

              {/* Avatar */}
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shadow-lg font-display font-bold text-2xl text-white"
                style={{ backgroundColor: p.colour }}
              >
                {initials(p.name)}
              </div>

              <span className="font-bold text-white text-base leading-tight text-center">{p.name}</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: p.colour }}>Enter PIN →</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

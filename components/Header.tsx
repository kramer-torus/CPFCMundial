'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LogOut, HelpCircle } from 'lucide-react';
import { getSession, clearSession } from '@/lib/auth';
import type { Session } from '@/lib/types';

export default function Header() {
  const [session, setSession] = useState<Session | null>(null);
  const router = useRouter();

  useEffect(() => {
    setSession(getSession());
    const handler = () => setSession(getSession());
    window.addEventListener('storage', handler);
    window.addEventListener('cpfc-session-change', handler);
    return () => {
      window.removeEventListener('storage', handler);
      window.removeEventListener('cpfc-session-change', handler);
    };
  }, []);

  function logout() {
    clearSession();
    window.dispatchEvent(new Event('cpfc-session-change'));
    router.push('/login');
  }

  return (
    <header className="relative sticky top-0 z-50 px-4 h-14 flex items-center justify-between" style={{ background: 'linear-gradient(to bottom, #0c1520, #0F1923)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: 'linear-gradient(90deg, transparent 0%, #C4122E 30%, #C4122E 70%, transparent 100%)' }} />
      <Link href="/" className="flex items-center gap-1.5">
        <span className="font-display font-bold text-2xl leading-none tracking-wide">
          <span className="text-white">CPFC</span><span className="text-gold">MUNDIAL</span>
        </span>
        <span className="text-base leading-none">🦅</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/how-it-works" className="text-white/35 hover:text-white/70 transition-colors">
          <HelpCircle size={17} />
        </Link>
        {session && (
          <>
            <div className="flex items-center gap-1.5 bg-white/5 rounded-full px-2.5 py-1">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: session.accent_colour }} />
              <span className="text-xs font-semibold text-white/70">{session.display_name}</span>
            </div>
            <button onClick={logout} className="text-white/35 hover:text-white/70 transition-colors">
              <LogOut size={15} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

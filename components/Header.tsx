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
    <header className="sticky top-0 z-50 bg-bg-card border-b border-white/10 px-4 h-13 flex items-center justify-between">
      <Link href="/" className="font-extrabold text-lg tracking-tight">
        <span className="text-palace-red">CPFC</span>
        <span className="text-white">Mundial</span>
        <span className="ml-1">🦅</span>
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/how-it-works" className="text-white/40 hover:text-white/70 transition-colors">
          <HelpCircle size={18} />
        </Link>
        {session && (
          <>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: session.accent_colour }} />
              <span className="text-sm font-medium text-white/80">{session.display_name}</span>
            </div>
            <button onClick={logout} className="text-white/40 hover:text-white/70 transition-colors">
              <LogOut size={16} />
            </button>
          </>
        )}
      </div>
    </header>
  );
}

'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '@/lib/auth';
import type { Session } from '@/lib/types';

export default function AuthGuard({ children, adminOnly = false }: { children: React.ReactNode; adminOnly?: boolean }) {
  const [session, setSession] = useState<Session | null | 'loading'>('loading');
  const router = useRouter();

  useEffect(() => {
    const s = getSession();
    if (!s) {
      router.push('/login');
      return;
    }
    if (adminOnly && !s.is_admin) {
      router.push('/');
      return;
    }
    setSession(s);
  }, [router, adminOnly]);

  if (session === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-40">
        <div className="w-8 h-8 border-2 border-palace-red border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  return <>{children}</>;
}

'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, ClipboardList, Calendar, Users, Flame } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Home', Icon: Trophy },
  { href: '/fixtures', label: 'Fixtures', Icon: Calendar },
  { href: '/squads', label: 'Squads', Icon: Users },
  { href: '/quiz', label: 'Gauntlet', Icon: Flame },
  { href: '/draft', label: 'Draft', Icon: ClipboardList },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 safe-bottom" style={{ background: 'linear-gradient(to top, #0c1520, #1A2535)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div className="h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #C4122E 20%, #C4122E 80%, transparent)' }} />
      <div className="max-w-lg mx-auto flex">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2.5 gap-0.5 transition-all ${active ? 'text-palace-red' : 'text-white/35 hover:text-white/60'}`}
            >
              <div className={`rounded-xl p-1.5 transition-all ${active ? 'bg-palace-red/15 shadow-[0_0_12px_rgba(196,18,46,0.25)]' : ''}`}>
                <Icon size={19} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-wider">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

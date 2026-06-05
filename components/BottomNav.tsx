'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Trophy, ClipboardList, Globe, Flame, BarChart2 } from 'lucide-react';

const TABS = [
  { href: '/', label: 'Home', Icon: Trophy },
  { href: '/draft', label: 'Draft', Icon: ClipboardList },
  { href: '/teams', label: 'Teams', Icon: Globe },
  { href: '/quiz', label: 'Gauntlet', Icon: Flame },
  { href: '/scores', label: 'Scores', Icon: BarChart2 },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-bg-card border-t-2 border-palace-red/60 z-50 safe-bottom">
      <div className="max-w-lg mx-auto flex">
        {TABS.map(({ href, label, Icon }) => {
          const active = href === '/' ? pathname === '/' : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-2 gap-0.5 transition-all ${active ? 'text-palace-red' : 'text-white/40 hover:text-white/70'}`}
            >
              <div className={`rounded-lg p-1 transition-colors ${active ? 'bg-palace-red/15' : ''}`}>
                <Icon size={20} strokeWidth={active ? 2.5 : 1.8} />
              </div>
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

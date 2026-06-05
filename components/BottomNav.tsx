'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: '🏠' },
  { href: '/draft', label: 'Draft', icon: '📋' },
  { href: '/teams', label: 'Teams', icon: '⚽' },
  { href: '/scores', label: 'Scores', icon: '📊' },
];

export default function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-navy border-t border-gold/30 z-50">
      <div className="max-w-lg mx-auto flex">
        {NAV_ITEMS.map(({ href, label, icon }) => {
          const active = pathname === href || (href !== '/' && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex-1 flex flex-col items-center py-3 text-xs font-medium transition-colors ${
                active ? 'text-palace-red' : 'text-white/60 hover:text-white'
              }`}
            >
              <span className="text-xl mb-0.5">{icon}</span>
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Home, Target, User, Layers, Swords } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Start', icon: Home },
  { href: '/missions', label: 'Misje', icon: Target },
  { href: '/cards', label: 'Karty', icon: Layers },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/profile', label: 'Profil', icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-4 right-4 z-40 pb-safe">
      <div className="max-w-sm mx-auto bg-dark-900/90 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-lg shadow-black/40">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map(item => {
            const isActive = pathname === item.href ||
              (item.href === '/arena' && (pathname === '/battles' || pathname === '/tuning'));
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl transition-all duration-200 relative',
                  isActive
                    ? 'text-turbo-400 w-12 h-10 bg-turbo-500/15'
                    : 'text-dark-500 hover:text-dark-300 w-12 h-10'
                )}
              >
                {isActive && (
                  <div className="absolute -top-2.5 w-6 h-1 bg-turbo-500 rounded-full" />
                )}
                <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'drop-shadow-[0_0_6px_rgba(139,92,246,0.5)]')} />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

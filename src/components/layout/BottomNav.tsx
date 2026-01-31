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
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-dark-900/95 backdrop-blur-sm border-t border-dark-800 pb-safe">
      <div className="flex items-center justify-around h-16 max-w-content mx-auto px-2">
        {navItems.map(item => {
          const isActive = pathname === item.href ||
            (item.href === '/arena' && (pathname === '/battles' || pathname === '/tuning'));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center px-4 py-2 rounded-xl transition-all duration-200 relative',
                isActive
                  ? 'text-turbo-400'
                  : 'text-dark-500 hover:text-dark-300'
              )}
            >
              {isActive && (
                <div className="absolute -top-1 w-8 h-1 bg-turbo-500 rounded-full" />
              )}
              <Icon className={cn('w-5 h-5 mb-0.5', isActive && 'drop-shadow-[0_0_6px_rgba(217,70,239,0.5)]')} />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

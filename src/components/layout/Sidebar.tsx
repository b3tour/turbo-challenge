'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { User as UserType } from '@/types';
import { Avatar } from '@/components/ui';
import NotificationBell from './NotificationBell';
import {
  Home,
  Target,
  Layers,
  Swords,
  Trophy,
  Package,
  Gift,
  HelpCircle,
} from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Start', icon: Home },
  { href: '/missions', label: 'Misje', icon: Target },
  { href: '/cards', label: 'Kolekcja', icon: Layers },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/mystery', label: 'Mystery Garage', icon: Package },
  { href: '/leaderboard', label: 'Ranking', icon: Trophy },
  { href: '/rewards', label: 'Nagrody', icon: Gift },
];

interface SidebarProps {
  user?: UserType | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-64 bg-dark-900/90 backdrop-blur-xl border-r border-white/[0.06] flex flex-col z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 px-6 h-16 border-b border-dark-800">
        <Image
          src="/heart-icon.png"
          alt="Turbo Challenge"
          width={28}
          height={28}
          className="object-contain"
          priority
        />
        <div className="flex items-center gap-1">
          <span className="text-lg font-bold text-white">TURBO</span>
          <span className="text-lg font-bold gradient-text">CHALLENGE</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => {
          const isActive = pathname === item.href ||
            (item.href === '/arena' && (pathname === '/battles' || pathname === '/tuning'));
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-turbo-500/10 text-turbo-400'
                  : 'text-dark-400 hover:text-white hover:bg-dark-800'
              )}
            >
              <Icon className="w-5 h-5" />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-turbo-500" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* User section */}
      {user && (
        <div className="px-3 py-4 border-t border-dark-800 space-y-2">
          <div className="flex items-center justify-between px-3">
            <NotificationBell userId={user.id} />
          </div>
          <Link
            href="/profile"
            className={cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150',
              pathname === '/profile'
                ? 'bg-turbo-500/10'
                : 'hover:bg-dark-800'
            )}
          >
            <Avatar
              src={user.avatar_url}
              fallback={user.nick}
              size="sm"
              showBorder
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user.nick}</p>
              <p className="text-xs text-dark-500">Profil</p>
            </div>
          </Link>
        </div>
      )}
    </aside>
  );
}

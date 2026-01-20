'use client';

import Link from 'next/link';
import Image from 'next/image';
import { User } from '@/types';
import { Avatar, Badge } from '@/components/ui';
import { calculateLevel, formatNumber, calculateLevelProgress } from '@/lib/utils';
import { Bell } from 'lucide-react';

interface HeaderProps {
  user?: User | null;
  showNotifications?: boolean;
}

export function Header({ user, showNotifications = true }: HeaderProps) {
  const level = user ? calculateLevel(user.total_xp) : null;
  const progress = user ? calculateLevelProgress(user.total_xp) : 0;

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-dark-900/95 backdrop-blur-lg border-b border-dark-800 pt-safe">
      <div className="flex items-center justify-between h-16 px-4 max-w-lg mx-auto">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2">
          <Image
            src="/heart-icon.png"
            alt="Turbo Challenge"
            width={36}
            height={36}
            className="object-contain"
            priority
          />
          <span className="text-lg font-bold text-white tracking-tight">
            TURBO <span className="text-turbo-500">CHALLENGE</span>
          </span>
        </Link>

        {/* User info */}
        {user && (
          <div className="flex items-center gap-3">
            {/* XP i Level */}
            <div className="text-right mr-2">
              <div className="flex items-center gap-1">
                <span className="text-xs">{level?.badge_icon}</span>
                <span className="text-sm font-medium text-white">
                  Lvl {level?.id}
                </span>
              </div>
              <div className="w-16 h-1.5 bg-dark-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-turbo-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Notifications */}
            {showNotifications && (
              <Link
                href="/notifications"
                className="relative p-2 text-dark-400 hover:text-white transition-colors"
              >
                <Bell className="w-5 h-5" />
                {/* Badge dla nieprzeczytanych */}
                {/* <span className="absolute top-1 right-1 w-2 h-2 bg-turbo-500 rounded-full" /> */}
              </Link>
            )}

            {/* Avatar */}
            <Link href="/profile">
              <Avatar
                src={user.avatar_url}
                fallback={user.nick}
                size="sm"
                showBorder
              />
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

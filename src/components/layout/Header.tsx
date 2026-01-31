'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { HelpCircle } from 'lucide-react';
import { User } from '@/types';
import { Avatar, AppInfoModal } from '@/components/ui';
import NotificationBell from './NotificationBell';

interface HeaderProps {
  user?: User | null;
}

export function Header({ user }: HeaderProps) {
  const [showAppInfo, setShowAppInfo] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-40 bg-gradient-to-b from-[#0a0a0f]/90 to-transparent backdrop-blur-xl pt-safe">
        <div className="flex items-center justify-between h-16 px-4 sm:px-6 max-w-content mx-auto">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <Image
              src="/heart-icon.png"
              alt="Turbo Challenge"
              width={28}
              height={28}
              className="object-contain flex-shrink-0"
              priority
            />
            <div className="flex items-baseline gap-1 min-w-0">
              <span className="text-base font-bold tracking-tight text-white">TURBO</span>
              <span className="text-base font-bold tracking-tight text-turbo-500">CHALLENGE</span>
            </div>
          </Link>

          {/* User actions */}
          {user && (
            <div className="flex items-center gap-2">
              {/* Notifications */}
              <NotificationBell userId={user.id} />

              {/* Help icon */}
              <button
                onClick={() => setShowAppInfo(true)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-2 hover:bg-surface-3 transition-colors"
                aria-label="Informacje o aplikacji"
              >
                <HelpCircle className="w-4 h-4 text-dark-300" />
              </button>

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

      {/* App Info Modal */}
      <AppInfoModal isOpen={showAppInfo} onClose={() => setShowAppInfo(false)} />
    </>
  );
}

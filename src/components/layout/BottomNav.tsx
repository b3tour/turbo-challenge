'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, Target, User, Layers, Swords } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Start', icon: Home },
  { href: '/missions', label: 'Misje', icon: Target },
  { href: '/cards', label: 'Karty', icon: Layers },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/profile', label: 'Profil', icon: User },
];

const springTransition = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
};

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
                  'flex flex-col items-center justify-center rounded-xl transition-colors duration-200 relative w-12 h-10',
                  isActive
                    ? 'text-[#22d3ee]'
                    : 'text-dark-500 hover:text-dark-300'
                )}
              >
                {/* Animated indicator pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className="absolute -top-2.5 w-8 h-[2px] rounded-full bg-[#22d3ee]"
                    style={{
                      boxShadow: '0 0 10px #22d3ee, 0 0 20px rgba(34, 211, 238, 0.3)',
                    }}
                    transition={springTransition}
                  />
                )}

                {/* Glow effect behind active icon */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-glow"
                    className="absolute inset-0 rounded-xl bg-[#22d3ee]/10"
                    transition={springTransition}
                  />
                )}

                {/* Icon with scale animation */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={springTransition}
                  className="mb-0.5"
                >
                  <Icon className={cn(
                    'w-5 h-5',
                    isActive && 'drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]'
                  )} />
                </motion.div>

                <span className={cn(
                  'text-[10px] font-medium',
                  isActive && 'text-[#22d3ee]'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

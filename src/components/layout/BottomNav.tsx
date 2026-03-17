'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Home, Target, Layers, Swords, Gift } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Start', icon: Home },
  { href: '/missions', label: 'Misje', icon: Target },
  { href: '/cards', label: 'Karty', icon: Layers },
  { href: '/arena', label: 'Arena', icon: Swords },
  { href: '/mystery', label: 'Mystery', icon: Gift, highlight: true },
];

const springTransition = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 30,
};

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40">
      <div className="px-4" style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom, 6px))' }}>
      <div className="max-w-sm mx-auto bg-dark-900/95 backdrop-blur-2xl rounded-2xl border border-white/[0.08] shadow-xl shadow-black/60">
        <div className="flex items-center justify-around h-14 px-2">
          {navItems.map(item => {
            const isActive = pathname === item.href ||
              (item.href === '/arena' && pathname === '/battles');
            const Icon = item.icon;
            const isMystery = 'highlight' in item && item.highlight;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl transition-colors duration-200 relative w-12 h-10',
                  isActive
                    ? 'text-[#22d3ee]'
                    : isMystery
                      ? 'text-amber-400 hover:text-amber-300'
                      : 'text-dark-400 hover:text-dark-300'
                )}
              >
                {/* Animated indicator pill */}
                {isActive && (
                  <motion.div
                    layoutId="bottom-nav-indicator"
                    className={cn(
                      'absolute -top-2.5 w-8 h-[2px] rounded-full',
                      isMystery ? 'bg-amber-400' : 'bg-[#22d3ee]'
                    )}
                    style={{
                      boxShadow: isMystery
                        ? '0 0 10px #f59e0b, 0 0 20px rgba(245, 158, 11, 0.3)'
                        : '0 0 10px #22d3ee, 0 0 20px rgba(34, 211, 238, 0.3)',
                    }}
                    transition={springTransition}
                  />
                )}

                {/* Subtle pulse glow for mystery when not active */}
                {isMystery && !isActive && (
                  <div className="absolute inset-0 rounded-xl animate-pulse pointer-events-none">
                    <div className="absolute inset-0 bg-amber-400/[0.06] rounded-xl" />
                  </div>
                )}

                {/* Icon with scale animation + soft glow */}
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                  }}
                  transition={springTransition}
                  className="relative mb-0.5"
                >
                  {isActive && (
                    <div className={cn(
                      'absolute inset-0 blur-lg rounded-full pointer-events-none',
                      isMystery ? 'bg-amber-400/20' : 'bg-[#22d3ee]/20'
                    )} />
                  )}
                  <Icon className={cn(
                    'w-5 h-5 relative',
                    isActive && !isMystery && 'drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]',
                    isActive && isMystery && 'drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]',
                    !isActive && isMystery && 'drop-shadow-[0_0_4px_rgba(245,158,11,0.3)]'
                  )} />
                </motion.div>

                <span className={cn(
                  'text-[10px] font-medium',
                  isActive && !isMystery && 'text-[#22d3ee]',
                  isActive && isMystery && 'text-amber-400',
                  !isActive && isMystery && 'text-amber-400/80'
                )}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
      </div>
    </nav>
  );
}

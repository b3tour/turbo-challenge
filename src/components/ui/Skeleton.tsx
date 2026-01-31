'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular' | 'card';
  lines?: number;
}

export function Skeleton({
  className,
  variant = 'rectangular',
  lines = 1,
}: SkeletonProps) {
  const baseClass = 'skeleton-pulse';

  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-xl',
    card: 'rounded-2xl',
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(baseClass, variants.text, i === lines - 1 && 'w-3/4')}
          />
        ))}
      </div>
    );
  }

  return (
    <div className={cn(baseClass, variants[variant], className)} />
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div className={cn('bg-dark-800 rounded-2xl p-5 shadow-surface space-y-3', className)}>
      <div className="flex items-center gap-3">
        <Skeleton variant="circular" className="w-10 h-10 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="w-2/3" />
          <Skeleton variant="text" className="w-1/3 h-3" />
        </div>
      </div>
      <Skeleton variant="rectangular" className="w-full h-4" />
    </div>
  );
}

export function SkeletonList({ count = 3, className }: { count?: number; className?: string }) {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

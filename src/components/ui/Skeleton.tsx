import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  variant?: 'rect' | 'circle' | 'text';
}

export function Skeleton({ className, variant = 'rect' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[rgba(255,255,255,0.30)] backdrop-filter-[saturate(180%)_blur(20px)]',
        'border border-[rgba(255,255,255,0.25)]',
        variant === 'circle' && 'rounded-full',
        variant === 'rect' && 'rounded-[12px]',
        variant === 'text' && 'h-4 w-full rounded-[6px]',
        className
      )}
    />
  );
}

"use client";

import { cn } from '@/lib/utils';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'warning' | 'info' | 'success';
  className?: string;
  style?: React.CSSProperties;
}

export function Badge({ children, variant = 'primary', className, style }: BadgeProps) {
  const variants = {
    primary: 'bg-[#429DFE] text-white',
    secondary: 'bg-[rgba(66,157,254,0.08)] backdrop-filter-[saturate(180%)_blur(20px)] border border-[rgba(66,157,254,0.3)] text-primary',
    accent: 'bg-[#9b51e0] text-white',
    outline: 'bg-[rgba(66,157,254,0.05)] border border-[rgba(66,157,254,0.25)] text-primary',
    warning: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border border-blue-200',
    success: 'bg-green-100 text-green-800 border border-green-200',
  };

  return (
    <span
      style={style}
      className={cn(
        'inline-flex items-center px-3 py-1 text-xs font-semibold',
        'rounded-full letter-spacing-[-0.01em]',
        'transition-all duration-150 ease-out',
        className,
        variants[variant]
      )}
    >
      {children}
    </span>
  );
}

"use client";

import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: 'default' | 'elevated' | 'subtle';
}

export function GlassCard({ 
  children, 
  className, 
  hoverEffect = true,
  variant = 'default' 
}: GlassCardProps) {
  const variants = {
    default: 'bg-[rgba(255,255,255,0.40)] backdrop-filter-[saturate(180%)_blur(20px)]',
    elevated: 'bg-[rgba(255,255,255,0.60)] backdrop-filter-[saturate(180%)_blur(20px)] shadow-soft',
    subtle: 'bg-[rgba(255,255,255,0.25)] backdrop-filter-[saturate(150%)_blur(15px)]',
  };

  return (
    <div
      className={cn(
        'border border-[rgba(255,255,255,0.35)] rounded-[20px] p-6',
        'transition-all duration-150 ease-out',
        variants[variant],
        hoverEffect && 'hover:shadow-hover hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  );
}

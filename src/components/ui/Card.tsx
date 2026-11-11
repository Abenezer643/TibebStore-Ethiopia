"use client";

import { cn } from '@/lib/utils';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hoverEffect?: boolean;
  variant?: 'default' | 'elevated' | 'subtle';
}

export function Card({ children, className, hoverEffect = true, variant = 'default' }: CardProps) {
  const variants = {
    default: 'bg-[rgba(255,255,255,0.40)] backdrop-filter-[saturate(180%)_blur(20px)]',
    elevated: 'bg-[rgba(255,255,255,0.60)] backdrop-filter-[saturate(180%)_blur(20px)] shadow-soft',
    subtle: 'bg-[rgba(255,255,255,0.25)] backdrop-filter-[saturate(150%)_blur(15px)]',
  };

  return (
    <div
      className={cn(
        'border border-[rgba(15,23,42,0.10)] rounded-3xl p-6',
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

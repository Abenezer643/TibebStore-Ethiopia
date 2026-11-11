"use client";

import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StarRatingProps {
  rating: number;
  max?: number;
  className?: string;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
}

export function StarRating({
  rating,
  max = 5,
  className,
  interactive = false,
  onRatingChange,
}: StarRatingProps) {
  return (
    <div className={cn('flex items-center gap-1', className)}>
      {Array.from({ length: max }).map((_, i) => {
        const starIndex = i + 1;
        const isActive = starIndex <= rating;

        return (
          <button
            key={i}
            type={interactive ? 'button' : undefined}
            disabled={!interactive}
            onClick={() => interactive && onRatingChange?.(starIndex)}
            className={cn(
              'transition-all duration-150',
              interactive && 'hover:scale-110 active:scale-95 cursor-pointer',
              !interactive && 'cursor-default'
            )}
          >
            <Star
              className={cn(
                'w-5 h-5 transition-colors',
                isActive ? 'fill-accent text-accent' : 'text-gray-300'
              )}
              strokeWidth={isActive ? 2.5 : 2}
            />
          </button>
        );
      })}
    </div>
  );
}

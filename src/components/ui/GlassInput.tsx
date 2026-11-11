"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  icon?: React.ReactNode;
}

const GlassInput = React.forwardRef<HTMLInputElement, GlassInputProps>(
  ({ className, error, label, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-semibold text-text-primary letter-spacing-[-0.01em]">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-text-secondary">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'flex w-full bg-[rgba(255,255,255,0.50)]',
              'backdrop-filter-[saturate(180%)_blur(20px)]',
              'border border-[rgba(255,255,255,0.35)]',
              'rounded-[10px] px-4 py-3 text-base',
              'text-text-primary placeholder:text-text-secondary',
              'transition-all duration-150 ease-out',
              'focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-error focus:border-error focus:ring-error/15',
              icon && 'pl-12',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm font-medium text-error">{error}</p>
        )}
      </div>
    );
  }
);

GlassInput.displayName = 'GlassInput';

export { GlassInput };

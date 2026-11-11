"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#429DFE] text-white hover:bg-[#3b8de0] shadow-sm hover:shadow-md',
      secondary: 'bg-[rgba(66,157,254,0.08)] backdrop-filter-[saturate(180%)_blur(20px)] border border-[rgba(66,157,254,0.3)] text-primary hover:bg-[rgba(66,157,254,0.15)] hover:border-[rgba(66,157,254,0.5)] shadow-sm',
      accent: 'bg-[#9b51e0] text-white hover:bg-[#8a3ed3] shadow-sm hover:shadow-md',
      outline: 'bg-[rgba(66,157,254,0.05)] border border-[rgba(66,157,254,0.25)] text-primary hover:bg-[rgba(66,157,254,0.12)] hover:border-[rgba(66,157,254,0.4)] hover:shadow-sm',
      ghost: 'bg-transparent text-text-secondary hover:bg-[rgba(66,157,254,0.08)] hover:text-primary',
      destructive: 'bg-[#ef4444] text-white hover:bg-[#dc2626] shadow-sm hover:shadow-md',
    };

    const sizes = {
      sm: 'px-4 py-2 text-sm rounded-full',
      md: 'px-6 py-3 text-base rounded-full',
      lg: 'px-8 py-4 text-lg font-bold rounded-full',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'relative inline-flex items-center justify-center font-semibold',
          'letter-spacing-[-0.01em]',
          'transition-all duration-150 ease-out',
          'hover:-translate-y-px active:translate-y-0',
          'disabled:cursor-not-allowed disabled:opacity-50 disabled:transform-none',
          'focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2',
          variants[variant],
          sizes[size],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

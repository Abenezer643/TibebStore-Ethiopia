
"use client";

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, icon, type = 'text', ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === 'password';

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
            type={isPassword && showPassword ? 'text' : type}
            className={cn(
              'flex w-full bg-[rgba(255,255,255,0.50)]',
              'backdrop-filter-[saturate(180%)_blur(20px)]',
              'border border-[rgba(15,23,42,0.12)]',
              'rounded-2xl px-4 py-3 text-base',
              'text-text-primary placeholder:text-text-secondary',
              'transition-all duration-150 ease-out',
              'focus:outline-none focus:border-primary focus:ring-[3px] focus:ring-primary/15',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error && 'border-error focus:border-error focus:ring-error/15',
              icon && 'pl-12',
              isPassword && 'pr-12',
              className
            )}
            {...props}
          />

          {isPassword && (
            <button
              type="button"
              disabled={props.disabled}
              onClick={() => setShowPassword((previous) => !previous)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              aria-pressed={showPassword}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-text-secondary hover:text-text-primary transition-colors focus:outline-none rounded-md"
            >
              {showPassword ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M3 3l18 18" />
                  <path d="M10.58 10.58a2 2 0 0 0 2.83 2.83" />
                  <path d="M9.88 5.09A10.94 10.94 0 0 1 12 4.5c5 0 9.27 3.11 11 7.5a11.8 11.8 0 0 1-4.16 5.13" />
                  <path d="M6.61 6.61A11.8 11.8 0 0 0 1 12c1.73 4.39 6 7.5 11 7.5a10.9 10.9 0 0 0 4.39-.91" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M2 12s3.64-7 10-7 10 7 10 7-3.64 7-10 7-10-7-10-7Z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              )}
            </button>
          )}
        </div>

        {error && (
          <p className="text-sm font-medium text-error">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

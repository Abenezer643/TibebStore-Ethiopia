"use client";

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export function SearchBar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(searchParams.get('search') || '');
  const debouncedValue = useDebounce(value, 300);

  const currentSearch = searchParams.get('search') || '';

  useEffect(() => {
    const targetSearch = debouncedValue || '';
    
    if (currentSearch !== targetSearch) {
      const params = new URLSearchParams(searchParams);
      if (debouncedValue) {
        params.set('search', debouncedValue);
      } else {
        params.delete('search');
      }
      
      startTransition(() => {
        router.push(`?${params.toString()}`);
      });
    }
  }, [debouncedValue, router, searchParams, currentSearch]);

  return (
    <div className="relative w-full">
      <div className="relative flex items-center">
        <Search className="absolute left-4 h-5 w-5 text-text-secondary" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search for unique Ethiopian crafts..."
          className="w-full py-4 pl-12 pr-12 text-base bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(255,255,255,0.35)] rounded-xl placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all shadow-sm"
        />
        {value && (
          <button
            onClick={() => setValue('')}
            className="absolute right-4 p-1 hover:bg-[rgba(66,157,254,0.1)] rounded-full transition-colors"
          >
            <X className="h-5 w-5 text-text-secondary" />
          </button>
        )}
      </div>
      {isPending && (
        <div className="absolute -bottom-1 left-0 h-1 w-full overflow-hidden rounded-full">
          <div className="h-full bg-primary animate-progress-line" />
        </div>
      )}
    </div>
  );
}

"use client";

import { Button } from '@/components/ui/Button';
import { Home, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="text-9xl font-black uppercase tracking-tighter mb-4 text-primary opacity-20">
        Error
      </div>
      <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 relative">
        Something went wrong
      </h1>
      <p className="text-xl font-bold text-text-secondary uppercase tracking-tight max-w-lg mb-12">
        We encountered an unexpected issue while showcasing our crafts. Don't worry, our artisans are already on it.
      </p>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button onClick={() => reset()} className="flex-1 h-14">
          <RefreshCcw className="mr-2 h-5 w-5" />
          Try Again
        </Button>
        <Link href="/" className="flex-1">
          <Button variant="outline" className="w-full h-14">
            <Home className="mr-2 h-5 w-5" />
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}

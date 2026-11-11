import { Button } from '@/components/ui/Button';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[70vh] text-center">
      <div className="text-[10rem] md:text-[15rem] font-black uppercase tracking-tighter mb-4 text-secondary leading-none">
        404
      </div>
      <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-6 -mt-8 md:-mt-12">
        Craft Not Found
      </h1>
      <p className="text-xl font-bold text-text-secondary uppercase tracking-tight max-w-lg mb-12">
        The masterpiece you're looking for seems to have found a new home, or the path to it has changed.
      </p>

      <Link href="/">
        <Button size="lg" className="h-16 px-12 text-xl">
          <Home className="mr-3 h-6 w-6" />
          Back to Marketplace
        </Button>
      </Link>
    </div>
  );
}

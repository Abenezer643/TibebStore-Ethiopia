import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { XCircle } from 'lucide-react';
import Link from 'next/link';

export default function CheckoutCancelPage() {
  return (
    <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-24 h-24 bg-error border-4 border-black shadow-neo flex items-center justify-center mb-8">
        <XCircle className="w-12 h-12 text-white" />
      </div>
      
      <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-center mb-4">
        Payment Cancelled
      </h1>
      <p className="text-xl font-bold text-text-secondary uppercase tracking-tight text-center max-w-lg mb-12">
        No worries! Your items are still safe in your cart. You can return to complete your purchase whenever you're ready.
      </p>

      <Link href="/" className="w-full max-w-xs">
        <Button variant="primary" className="w-full h-14">Return to Store</Button>
      </Link>
    </div>
  );
}

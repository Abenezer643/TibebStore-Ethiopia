"use client";

import Link from 'next/link';
import { ShoppingCart, ArrowLeft, Search, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/hooks/useCart';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface TenantNavbarProps {
  tenantName: string;
  tenantLogo?: string;
}

export function TenantNavbar({ tenantName, tenantLogo }: TenantNavbarProps) {
  const { getItemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full bg-[rgba(255,255,255,0.80)] backdrop-blur-xl border-b border-[rgba(15,23,42,0.10)] shadow-md">
      <div className="container mx-auto flex h-20 items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined' && window.history.length > 1) {
                router.back();
                return;
              }
              router.push('/products');
            }}
            className="p-2 rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md hover:shadow-lg transition-all cursor-pointer"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          
          <Link href="/" className="flex items-center gap-3 group">
            {tenantLogo ? (
              <img src={tenantLogo} alt={tenantName} className="h-10 w-10 rounded-xl object-cover border border-[rgba(15,23,42,0.10)]" />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md group-hover:shadow-lg transition-all">
                <span className="font-black text-xl">{tenantName[0]}</span>
              </div>
            )}
            <span className="text-xl font-black uppercase tracking-tighter">{tenantName}</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-text-primary" />
            <input
              type="text"
              placeholder={`Search in ${tenantName}...`}
              className="h-11 w-64 rounded-full bg-[rgba(255,255,255,0.50)] border border-[rgba(15,23,42,0.10)] pl-10 pr-4 text-sm font-bold placeholder:text-text-secondary focus:outline-none focus:bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          <Button 
            variant="primary" 
            size="sm" 
            className="relative"
            onClick={() => setIsCartOpen(true)}
          >
            <ShoppingCart className="h-6 w-6" />
            {getItemCount() > 0 && (
              <span className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-[10px] font-black text-white shadow-md">
                {getItemCount()}
              </span>
            )}
          </Button>
        </div>
      </div>
      <CartDrawer isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} />
    </header>
  );
}

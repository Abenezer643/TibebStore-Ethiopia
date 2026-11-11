"use client";

import React, { useState } from 'react';
import { useCart } from '@/hooks/useCart';
import { Drawer } from '@/components/ui/Drawer';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/lib/utils';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/components/ui/Toast';
import { useRouter } from 'next/navigation';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const { cart, removeItem, updateQuantity, getTenantTotal, getItemCount, clearTenantCart } = useCart();
  const tenantSlugs = Object.keys(cart);
  const { toast } = useToast();
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const [isCheckingOutAll, setIsCheckingOutAll] = useState(false);

  const checkoutTenant = async (tenantSlug: string) => {
    const tenantCart = cart[tenantSlug];
    if (!tenantCart || tenantCart.items.length === 0) return;

    setIsCheckingOut(tenantSlug);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          tenantSlug,
          items: tenantCart.items.map((i) => ({ productId: i.slug, quantity: i.quantity })),
        }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please sign in to checkout');
        }
        throw new Error(json?.error ?? 'Checkout failed');
      }
      clearTenantCart(tenantSlug);
      toast('success', 'Order placed! Redirecting to payment...');
      onClose();
      // Redirect to checkout for payment
      const orderId = json?.order?.id || json?.id;
      if (orderId) {
        router.push(`/checkout?orderId=${orderId}`);
      } else {
        router.push('/checkout');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Checkout failed';
      toast('error', message);
      if (message.toLowerCase().includes('sign in')) {
        router.push('/sign-in');
      }
    } finally {
      setIsCheckingOut((cur) => (cur === tenantSlug ? null : cur));
    }
  };

  const checkoutAll = async () => {
    const slugs = Object.keys(cart);
    if (slugs.length === 0) return;

    const allItems = slugs.flatMap((slug) => {
      const tenantCart = cart[slug];
      if (!tenantCart?.items?.length) return [];
      return tenantCart.items.map((i) => ({
        productId: i.slug,
        quantity: i.quantity,
        tenantSlug: slug,
        tenantId: (i as any).tenantId,
      }));
    });

    if (allItems.length === 0) return;

    setIsCheckingOutAll(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ items: allItems }),
      });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        if (res.status === 401) {
          throw new Error('Please sign in to checkout');
        }
        throw new Error(json?.error ?? 'Checkout failed');
      }

      for (const slug of slugs) {
        clearTenantCart(slug);
      }

      const createdOrders = Array.isArray(json?.orders) ? json.orders : (json?.order ? [json.order] : []);
      const firstOrderId = createdOrders[0]?.id || json?.id;
      
      toast('success', createdOrders.length > 1 ? `Orders placed (${createdOrders.length})! Redirecting to payment...` : 'Order placed! Redirecting to payment...');
      onClose();
      
      // Redirect to checkout for payment
      if (firstOrderId) {
        router.push(`/checkout?orderId=${firstOrderId}`);
      } else {
        router.push('/checkout');
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Checkout failed';
      toast('error', message);
      if (message.toLowerCase().includes('sign in')) {
        router.push('/sign-in');
      }
    } finally {
      setIsCheckingOutAll(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={`Your Cart (${getItemCount()})`}
      panelClassName="bg-[rgba(255,255,255,0.92)] backdrop-filter-[saturate(180%)_blur(28px)]"
    >
      <div className="flex flex-col min-h-full">
        {tenantSlugs.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 py-20 text-center space-y-4">
            <div className="w-20 h-20 rounded-2xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.10)] flex items-center justify-center shadow-md">
              <ShoppingBag className="w-10 h-10 text-text-secondary" />
            </div>
            <h3 className="text-xl font-bold tracking-tight text-text-primary">Your cart is empty</h3>
            <p className="text-sm text-text-secondary">Discover unique Ethiopian crafts to fill it up!</p>
            <Button onClick={onClose} className="mt-4">Continue Shopping</Button>
          </div>
        ) : (
          <>
            <div className="pb-4">
              <Button
                className="w-full"
                isLoading={isCheckingOutAll}
                onClick={checkoutAll}
              >
                Checkout All
              </Button>
            </div>
            <div className="flex-1 space-y-6 pb-20">
              {tenantSlugs.map((slug) => {
                const tenantCart = cart[slug];
                const tenantName = (tenantCart.items as any[])?.find((it) => typeof it?.tenantName === "string")?.tenantName as
                  | string
                  | undefined;
                
                return (
                  <div key={slug} className="rounded-2xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] overflow-hidden shadow-md">
                    <div className="bg-[rgba(66,157,254,0.08)] p-3 border-b border-[rgba(15,23,42,0.10)] flex items-center justify-between">
                      <h4 className="font-semibold text-sm text-text-primary">
                        Store: {tenantName || slug}
                      </h4>
                      <span className="text-xs text-primary underline cursor-pointer">Checkout all stores</span>
                    </div>
                    
                    <div className="divide-y divide-[rgba(15,23,42,0.08)]">
                      {tenantCart.items.map((item) => (
                        <div key={item.id} className="p-4 flex gap-4">
                          <div className="w-20 h-20 rounded-xl border border-[rgba(15,23,42,0.10)] shrink-0 overflow-hidden">
                            {Array.isArray(item.images) && item.images[0]?.url ? (
                              <img src={item.images[0].url} alt={item.images[0]?.alt ?? item.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-[rgba(255,255,255,0.40)]">
                                <span className="text-[10px] text-text-secondary">No image</span>
                              </div>
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <h5 className="font-semibold text-sm text-text-primary line-clamp-1">{item.name}</h5>
                            <p className="text-primary font-bold">{formatCurrency(item.price)}</p>
                            
                            <div className="flex items-center justify-between pt-2">
                              <div className="flex items-center rounded-lg border border-[rgba(15,23,42,0.10)] bg-[rgba(255,255,255,0.40)]">
                                <button 
                                  onClick={() => updateQuantity(item.id, slug, item.quantity - 1)}
                                  className="p-2 hover:bg-[rgba(255,255,255,0.60)] transition-colors"
                                >
                                  <Minus className="w-4 h-4" />
                                </button>
                                <span className="px-3 py-1 font-semibold border-x border-[rgba(15,23,42,0.10)] min-w-[32px] text-center">
                                  {item.quantity}
                                </span>
                                <button 
                                  onClick={() => updateQuantity(item.id, slug, item.quantity + 1)}
                                  className="p-2 hover:bg-[rgba(255,255,255,0.60)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  disabled={item.stock !== null && item.stock !== undefined && item.quantity >= item.stock}
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                              <button 
                                onClick={() => removeItem(item.id, slug)}
                                className="text-error hover:scale-110 transition-transform"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-[rgba(255,255,255,0.40)] border-t border-[rgba(15,23,42,0.10)] flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-xs text-text-secondary">Subtotal</p>
                        <p className="text-xl font-bold text-primary">{formatCurrency(getTenantTotal(slug))}</p>
                      </div>
                      <Button
                        size="sm"
                        isLoading={isCheckingOut === slug}
                        onClick={() => checkoutTenant(slug)}
                      >
                        Checkout
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </Drawer>
  );
}

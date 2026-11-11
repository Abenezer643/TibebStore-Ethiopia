"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, Loader2 } from "lucide-react";

function CheckoutSuccessPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isHydrated, isAuthenticated } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  const orderId = searchParams.get("orderId");

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }

    if (orderId) {
      loadOrder();
    } else {
      setIsLoading(false);
    }
  }, [isHydrated, isAuthenticated, user, orderId, router]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (res.ok) {
        setOrder(json.order);
      }
    } catch (error) {
      console.error("Failed to load order:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6">
      <div className="max-w-lg mx-auto">
        <Card className="p-8 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-green-100 flex items-center justify-center">
            <CheckCircle className="w-12 h-12 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold mt-6">Payment Successful!</h1>
          <p className="text-text-secondary mt-2">
            Thank you for your order. Your support helps Ethiopian artisans continue their heritage.
          </p>

          {order && (
            <div className="mt-6 p-4 bg-[rgba(255,255,255,0.50)] rounded-xl">
              <p className="text-sm text-text-secondary">Order ID</p>
              <p className="font-bold text-lg">#{order.id?.slice(-6).toUpperCase()}</p>
              <p className="text-sm text-text-secondary mt-2">Total</p>
              <p className="font-bold text-primary text-lg">{order.total?.toLocaleString()} ETB</p>
            </div>
          )}

          <div className="flex flex-col gap-3 mt-8">
            <Link href="/account/orders">
              <Button variant="secondary" className="w-full">View My Orders</Button>
            </Link>
            <Link href="/">
              <Button variant="outline" className="w-full">Continue Shopping</Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-12 sm:px-6">
          <div className="flex justify-center items-center min-h-[400px]">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        </div>
      }
    >
      <CheckoutSuccessPageInner />
    </Suspense>
  );
}

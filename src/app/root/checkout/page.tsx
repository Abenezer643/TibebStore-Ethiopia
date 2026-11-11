"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { CheckCircle, XCircle, Loader2, Package } from "lucide-react";

function CheckoutPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaying, setIsPaying] = useState(false);

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
      // Check for recent unpaid orders
      loadRecentOrder();
    }
  }, [isHydrated, isAuthenticated, user, orderId, router]);

  const loadOrder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      const json = await res.json();
      if (res.ok) {
        setOrder(json.order);
      } else {
        toast("error", "Order not found");
        router.push("/account/orders");
      }
    } catch (error) {
      toast("error", "Failed to load order");
    } finally {
      setIsLoading(false);
    }
  };

  const loadRecentOrder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/orders");
      const json = await res.json();
      if (res.ok && json.orders?.length > 0) {
        // Get the most recent unpaid order
        const unpaidOrder = json.orders.find((o: any) => o.paymentStatus === "pending" || !o.paymentStatus);
        if (unpaidOrder) {
          setOrder(unpaidOrder);
        } else {
          router.push("/account/orders");
        }
      } else {
        router.push("/account/orders");
      }
    } catch (error) {
      toast("error", "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!order) return;

    setIsPaying(true);
    try {
      const res = await fetch("/api/payments/chapa/initialize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: order.id }),
      });

      const json = await res.json().catch(() => null);

      if (res.ok && json.checkoutUrl) {
        // Redirect to Chapa checkout
        window.location.href = json.checkoutUrl;
      } else {
        const message =
          (typeof json?.error === "string" && json.error) ||
          (typeof json?.message === "string" && json.message) ||
          "Failed to initialize payment";
        console.error("[Checkout] Chapa init failed", { status: res.status, json });
        toast("error", message);
      }
    } catch (error) {
      console.error("[Checkout] Payment initialization error", error);
      toast("error", error instanceof Error ? error.message : "Payment initialization failed");
    } finally {
      setIsPaying(false);
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

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-12 sm:px-6">
        <Card className="p-6 text-center">
          <p className="text-text-secondary">No order to pay for.</p>
          <Link href="/account/orders">
            <Button variant="secondary" className="mt-4">View Orders</Button>
          </Link>
        </Card>
      </div>
    );
  }

  const isPaid = order.paymentStatus === "paid";

  return (
    <div className="container mx-auto px-4 py-12 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Status Header */}
        <Card className="p-6 text-center">
          {isPaid ? (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <h1 className="text-2xl font-bold mt-4">Payment Successful!</h1>
              <p className="text-text-secondary mt-2">Your order has been confirmed.</p>
            </>
          ) : (
            <>
              <Package className="w-16 h-16 mx-auto text-primary" />
              <h1 className="text-2xl font-bold mt-4">Complete Your Order</h1>
              <p className="text-text-secondary mt-2">Pay securely with Chapa</p>
            </>
          )}
        </Card>

        {/* Order Summary */}
        <Card className="p-6">
          <h2 className="text-lg font-bold uppercase tracking-tight mb-4">Order Summary</h2>
          
          <div className="space-y-4">
            {/* Items */}
            <div className="space-y-3">
              {order.items?.map((item: any, index: number) => (
                <div key={index} className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-[rgba(255,255,255,0.50)] flex-shrink-0">
                    {item.images?.[0]?.url ? (
                      <img src={item.images[0].url} alt={item.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-text-secondary" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{item.name}</p>
                    <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                  </div>
                  <p className="font-bold">{item.price?.toLocaleString()} ETB</p>
                </div>
              ))}
            </div>

            <div className="border-t border-[rgba(15,23,42,0.10)] pt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span>{order.subtotal?.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Shipping</span>
                <span>{order.shipping?.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Tax</span>
                <span>{order.tax?.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between font-bold text-lg pt-2 border-t border-[rgba(15,23,42,0.10)]">
                <span>Total</span>
                <span className="text-primary">{order.total?.toLocaleString()} ETB</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Payment Status */}
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold">Payment Status</h3>
              <p className="text-sm text-text-secondary mt-1">
                Order ID: #{order.id?.slice(-6).toUpperCase()}
              </p>
            </div>
            <Badge variant={isPaid ? "secondary" : "outline"}>
              {isPaid ? "Paid" : "Pending"}
            </Badge>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          {isPaid ? (
            <>
              <Link href="/account/orders" className="flex-1">
                <Button variant="secondary" className="w-full">View Orders</Button>
              </Link>
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">Continue Shopping</Button>
              </Link>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={handlePayment}
                isLoading={isPaying}
                disabled={isPaying}
              >
                {isPaying ? "Processing..." : `Pay ${order.total?.toLocaleString()} ETB`}
              </Button>
              <Link href="/account/orders" className="flex-1">
                <Button variant="outline" className="w-full">Pay Later</Button>
              </Link>
            </>
          )}
        </div>

        {/* Chapa Info */}
        {!isPaid && (
          <Card className="p-4 bg-[rgba(255,255,255,0.50)]">
            <p className="text-xs text-text-secondary text-center">
              Secure payment powered by <span className="font-bold">Chapa</span>. 
              Supports telebirr, CBE Birr, bank cards & more.
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function CheckoutPage() {
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
      <CheckoutPageInner />
    </Suspense>
  );
}

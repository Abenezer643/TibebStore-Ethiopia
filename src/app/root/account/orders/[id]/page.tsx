"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Suspense } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { Loader2, Package, Truck, CheckCircle, XCircle, MapPin, CreditCard, Clock, AlertTriangle, ShieldCheck } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  tenantSlug: string;
  images: { url: string; alt?: string }[];
}

interface StatusHistory {
  status: string;
  note?: string;
  changedAt: string;
}

interface Order {
  id: string;
  status: string;
  paymentStatus: string;
  paymentMethod?: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  statusHistory: StatusHistory[];
  createdAt: string;
  releaseStatus?: string;
  commissionRate?: number;
  platformFee?: number;
  sellerEarnings?: number;
  autoRefundAt?: string;
}

import { use } from "react";

function OrderDetailPageInner({ orderId }: { orderId: string }) {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConfirming, setIsConfirming] = useState(false);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }

    if (orderId) {
      fetchOrder();
    }
  }, [isHydrated, isAuthenticated, user, orderId]);

  const fetchOrder = async () => {
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

  const confirmDelivery = async () => {
    if (!order) return;
    setIsConfirming(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/status`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "confirm_delivery" }),
      });
      const json = await res.json();
      if (res.ok) {
        toast("success", "Delivery confirmed!");
        fetchOrder();
      } else {
        toast("error", json.error || "Failed to confirm delivery");
      }
    } catch (error) {
      toast("error", "Failed to confirm delivery");
    } finally {
      setIsConfirming(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-700 border-green-200";
      case "shipped":
        return "bg-blue-100 text-blue-700 border-blue-200";
      case "confirmed":
      case "processing":
        return "bg-purple-100 text-purple-700 border-purple-200";
      case "cancelled":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "shipped":
        return <Truck className="w-5 h-5 text-blue-600" />;
      case "confirmed":
      case "processing":
        return <Package className="w-5 h-5 text-purple-600" />;
      case "cancelled":
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-600" />;
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <p className="text-text-secondary">Order not found</p>
          <Button className="mt-4" onClick={() => router.push("/account/orders")}>
            View All Orders
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight">Order Details</h1>
          <p className="text-sm text-text-secondary mt-1">Order #{order.id.slice(-6).toUpperCase()}</p>
        </div>
        <Badge className={`text-sm px-3 py-1 ${getStatusColor(order.status)}`}>
          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
        </Badge>
      </div>

      {/* Status Timeline */}
      <Card className="p-6 mb-6">
        <h2 className="text-sm font-black uppercase tracking-tight mb-4">Order Timeline</h2>
        <div className="relative">
          {order.statusHistory.map((entry, index) => (
            <div key={index} className="flex gap-4 pb-6 last:pb-0">
              <div className="flex flex-col items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                  getStatusColor(entry.status)
                }`}>
                  {getStatusIcon(entry.status)}
                </div>
                {index < order.statusHistory.length - 1 && (
                  <div className="w-0.5 flex-1 bg-gray-200 mt-2" />
                )}
              </div>
              <div className="flex-1 pt-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-text-primary capitalize">{entry.status}</p>
                </div>
                {entry.note && (
                  <p className="text-sm text-text-secondary mt-1">{entry.note}</p>
                )}
                <p className="text-xs text-text-secondary mt-1">{formatDate(entry.changedAt)}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Shipping & Tracking */}
      {(order.trackingNumber || order.carrier) && (
        <Card className="p-6 mb-6">
          <h2 className="text-sm font-black uppercase tracking-tight mb-4">Shipping Information</h2>
          <div className="space-y-3">
            {order.carrier && (
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-text-secondary" />
                <span className="text-sm">Carrier: <strong>{order.carrier}</strong></span>
              </div>
            )}
            {order.trackingNumber && (
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-text-secondary" />
                <span className="text-sm">Tracking: <strong>{order.trackingNumber}</strong></span>
              </div>
            )}
            {order.shippedAt && (
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-secondary" />
                <span className="text-sm">Shipped: {formatDate(order.shippedAt)}</span>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Order Items */}
      <Card className="p-6 mb-6">
        <h2 className="text-sm font-black uppercase tracking-tight mb-4">Items</h2>
        <div className="divide-y divide-gray-100">
          {order.items.map((item, index) => (
            <div key={index} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <div className="w-20 h-20 rounded-xl border border-gray-200 overflow-hidden shrink-0">
                {item.images?.[0]?.url ? (
                  <img
                    src={item.images[0].url}
                    alt={item.images[0]?.alt || item.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-text-primary">{item.name}</p>
                <p className="text-sm text-text-secondary">Qty: {item.quantity}</p>
                <p className="text-sm font-bold text-primary mt-1">
                  {formatCurrency(item.price * item.quantity)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Payment Summary */}
      <Card className="p-6 mb-6">
        <h2 className="text-sm font-black uppercase tracking-tight mb-4">Payment Summary</h2>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Subtotal</span>
            <span>{formatCurrency(order.subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Shipping</span>
            <span>{formatCurrency(order.shipping)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-text-secondary">Tax</span>
            <span>{formatCurrency(order.tax)}</span>
          </div>
          <div className="flex justify-between font-bold text-lg pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(order.total)}</span>
          </div>
          {order.platformFee != null && order.platformFee > 0 && (
            <div className="flex justify-between text-xs text-text-secondary pt-1">
              <span>Includes platform fee ({order.commissionRate}%)</span>
              <span>{formatCurrency(order.platformFee)}</span>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-text-secondary" />
            <span className="text-sm">
              Payment Status: <Badge variant="outline" className="ml-2">
                {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
              </Badge>
            </span>
          </div>
          {order.releaseStatus && (
            <div className="flex items-center gap-2 mt-2">
              <ShieldCheck className="w-4 h-4 text-text-secondary" />
              <span className="text-sm">
                Funds: <Badge variant={order.releaseStatus === 'released' ? 'success' : order.releaseStatus === 'refunded' ? 'warning' : 'outline'} className="ml-2">
                  {order.releaseStatus === 'held' ? 'Held in Escrow' : order.releaseStatus === 'released' ? 'Released to Seller' : 'Refunded'}
                </Badge>
              </span>
            </div>
          )}
          {order.paymentMethod && (
            <p className="text-xs text-text-secondary mt-2">
              Paid via {order.paymentMethod.toUpperCase()}
            </p>
          )}
        </div>
      </Card>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => router.push("/account/orders")} className="flex-1">
          Back to Orders
        </Button>

        {order.status === "shipped" && (
          <Button
            onClick={confirmDelivery}
            isLoading={isConfirming}
            className="flex-1"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Confirm Delivery
          </Button>
        )}

        {order.status !== "cancelled" && order.status !== "delivered" && (
          <Button
            variant="outline"
            onClick={() => router.push(`/account/orders/${order.id}/dispute?orderId=${order.id}`)}
            className="flex-1 text-red-600 border-red-200 hover:bg-red-50"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            File Dispute
          </Button>
        )}
      </div>
    </div>
  );
}

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <OrderDetailPageInner orderId={resolvedParams.id} />
    </Suspense>
  );
}

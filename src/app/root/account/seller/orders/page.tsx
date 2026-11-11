"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { Package, Truck, CheckCircle, XCircle, Clock, ChevronDown, ChevronUp } from "lucide-react";

type SellerOrder = {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ productId: string; name: string; price: number; quantity: number }>;
  buyerName?: string;
  buyerEmail?: string;
  trackingNumber?: string;
  carrier?: string;
  shippedAt?: string;
  deliveredAt?: string;
  statusHistory?: Array<{ status: string; note?: string; changedAt: string }>;
  releaseStatus?: string;
  platformFee?: number;
  sellerEarnings?: number;
  commissionRate?: number;
  autoRefundAt?: string;
};

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: "Pending", color: "bg-[#f59e0b]", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-[#8b5cf6]", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-[#3b82f6]", icon: Package },
  shipped: { label: "Shipped", color: "bg-[#429DFE]", icon: Truck },
  delivered: { label: "Delivered", color: "bg-[#10b981]", icon: CheckCircle },
  cancelled: { label: "Cancelled", color: "bg-[#ef4444]", icon: XCircle },
};

function OrderStatusBadge({ status }: { status: string }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  return (
    <Badge className={`${config.color} text-white border-0 flex items-center gap-1`}>
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

export default function SellerOrdersPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<SellerOrder[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [trackingInput, setTrackingInput] = useState<{ orderId: string; trackingNumber: string; carrier: string }>({
    orderId: "",
    trackingNumber: "",
    carrier: "",
  });

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }
    if (user.isSuspended) {
      router.replace("/account");
      return;
    }
    if (user.role !== "seller" || user.sellerStatus !== "approved") {
      router.replace("/account/become-seller");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  const fetchOrders = () => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) return;
    if (user.isSuspended) return;
    if (user.role !== "seller" || user.sellerStatus !== "approved") return;

    let cancelled = false;
    setIsLoading(true);
    fetch("/api/seller/orders")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setOrders(Array.isArray(json?.orders) ? json.orders : []);
      })
      .catch(() => {
        if (cancelled) return;
        setOrders([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  };

  useEffect(() => {
    fetchOrders();
  }, [isHydrated, isAuthenticated, user]);

  const updateOrderStatus = async (orderId: string, newStatus: string, trackingNumber?: string, carrier?: string) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch(`/api/seller/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          trackingNumber,
          carrier,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        toast("error", json.error || "Failed to update order");
        return;
      }

      toast("success", `Order marked as ${newStatus}`);
      fetchOrders();
    } catch {
      toast("error", "Failed to update order");
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const getNextStatus = (currentStatus: string): string | null => {
    const flow: Record<string, string> = {
      pending: "confirmed",
      confirmed: "processing",
      processing: "shipped",
      // shipped → buyer confirms delivery, not seller
    };
    return flow[currentStatus] || null;
  };

  const getNextStatusLabel = (currentStatus: string): string => {
    const labels: Record<string, string> = {
      pending: "Confirm Order",
      confirmed: "Start Processing",
      processing: "Mark as Shipped",
    };
    return labels[currentStatus] || "";
  };

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Orders</h2>
            <p className="mt-1 text-sm font-bold text-text-secondary uppercase">
              Track and fulfill customer orders.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/account/seller">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-text-secondary uppercase">
            {isLoading ? "Loading..." : orders.length === 0 ? "No orders yet." : "Recent orders"}
          </p>
          <Badge variant="outline">{orders.length}</Badge>
        </div>
      </Card>

      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((o) => {
            const orderNumber = `ORD-${new Date(o.createdAt).getFullYear()}-${o.id.slice(-6).toUpperCase()}`;
            const itemCount = (o.items ?? []).reduce((sum, it) => sum + (it?.quantity ?? 0), 0);
            const isExpanded = expandedOrder === o.id;
            const isUpdating = updatingOrderId === o.id;
            const nextStatus = getNextStatus(o.status);
            const canUpdate = nextStatus && o.status !== "cancelled" && o.status !== "delivered";
            
            return (
              <Card key={o.id} className="p-6">
                <div className="flex flex-col gap-4">
                  {/* Order Header */}
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-black uppercase tracking-tight">{orderNumber}</p>
                      <p className="mt-1 text-xs font-bold text-text-secondary uppercase">
                        {new Date(o.createdAt).toLocaleString()} • {itemCount} item{itemCount === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <OrderStatusBadge status={o.status} />
                      {o.releaseStatus && (
                        <Badge variant={o.releaseStatus === 'released' ? 'success' : o.releaseStatus === 'refunded' ? 'warning' : 'outline'} className="text-xs">
                          {o.releaseStatus === 'held' ? 'Escrow' : o.releaseStatus === 'released' ? 'Paid' : 'Refunded'}
                        </Badge>
                      )}
                      <Badge variant="secondary">
                        {(o.sellerEarnings ?? 0) > 0 ? formatCurrency(o.sellerEarnings!) : formatCurrency(o.total)}
                      </Badge>
                      {(o.platformFee ?? 0) > 0 && (
                        <span className="text-xs text-text-secondary">after {o.commissionRate}% fee</span>
                      )}
                    </div>
                  </div>

                  {/* Buyer Info */}
                  {(o.buyerName || o.buyerEmail) && (
                    <div className="p-3 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.10)]">
                      <p className="text-xs font-black uppercase tracking-tight text-text-secondary">Buyer</p>
                      <p className="text-sm font-semibold text-text-primary">{o.buyerName || "Customer"}</p>
                      {o.buyerEmail && (
                        <p className="text-xs text-text-secondary">{o.buyerEmail}</p>
                      )}
                    </div>
                  )}

                  {/* Tracking Info (if shipped) */}
                  {o.trackingNumber && (
                    <div className="p-3 rounded-xl bg-[rgba(66,157,254,0.08)] border border-[rgba(66,157,254,0.20)]">
                      <p className="text-xs font-black uppercase tracking-tight text-text-secondary">Tracking</p>
                      <p className="text-sm font-semibold text-text-primary">{o.trackingNumber}</p>
                      {o.carrier && <p className="text-xs text-text-secondary">{o.carrier}</p>}
                    </div>
                  )}

                  {/* Action Buttons */}
                  {o.status === "shipped" && (
                    <div className="flex items-center gap-2 pt-2 border-t border-[rgba(15,23,42,0.10)]">
                      <Clock className="w-4 h-4 text-[#f59e0b]" />
                      <span className="text-sm text-text-secondary">Waiting for buyer to confirm delivery</span>
                    </div>
                  )}
                  {canUpdate && (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-[rgba(15,23,42,0.10)]">
                      {o.status === "processing" ? (
                        // Show tracking input for shipping
                        <div className="w-full space-y-3">
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              placeholder="Tracking number"
                              value={trackingInput.orderId === o.id ? trackingInput.trackingNumber : ""}
                              onChange={(e) => setTrackingInput({ ...trackingInput, orderId: o.id, trackingNumber: e.target.value })}
                              className="flex-1 px-3 py-2 text-sm rounded-lg border border-[rgba(15,23,42,0.10)] bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                            <input
                              type="text"
                              placeholder="Carrier (optional)"
                              value={trackingInput.orderId === o.id ? trackingInput.carrier : ""}
                              onChange={(e) => setTrackingInput({ ...trackingInput, orderId: o.id, carrier: e.target.value })}
                              className="sm:w-40 px-3 py-2 text-sm rounded-lg border border-[rgba(15,23,42,0.10)] bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                            />
                          </div>
                          <Button
                            size="sm"
                            onClick={() => updateOrderStatus(o.id, "shipped", trackingInput.trackingNumber, trackingInput.carrier)}
                            disabled={isUpdating}
                            className="w-full sm:w-auto"
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            Mark as Shipped
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => updateOrderStatus(o.id, nextStatus)}
                          disabled={isUpdating}
                        >
                          {getNextStatusLabel(o.status)}
                        </Button>
                      )}
                      {o.status !== "cancelled" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            if (confirm("Are you sure you want to cancel this order?")) {
                              updateOrderStatus(o.id, "cancelled", undefined, undefined);
                            }
                          }}
                          disabled={isUpdating}
                          className="text-red-600 border-red-200 hover:bg-red-50"
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}

                  {/* Expand/Collapse for Items */}
                  <button
                    onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                    className="flex items-center justify-between text-xs font-bold text-text-secondary uppercase hover:text-primary transition-colors pt-2 border-t border-[rgba(15,23,42,0.10)]"
                  >
                    <span>View Items</span>
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </button>

                  {/* Items (expandable) */}
                  {isExpanded && (
                    <div className="space-y-2 pt-2">
                      {(o.items ?? []).map((it) => (
                        <div key={`${o.id}-${it.productId}`} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.10)]">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-text-primary truncate">{it.name}</p>
                            <p className="text-xs text-text-secondary">{formatCurrency(it.price)} each</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="text-sm font-black">x{it.quantity}</p>
                            <p className="text-xs font-bold text-primary">{formatCurrency(it.price * it.quantity)}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

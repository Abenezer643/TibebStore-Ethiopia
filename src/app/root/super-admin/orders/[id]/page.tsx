"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { formatCurrency } from "@/lib/utils";
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  User,
  Store,
} from "lucide-react";

interface OrderDetail {
  id: string;
  userId: string;
  status: string;
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: string;
  paymentMethod: string | null;
  paymentRef: string | null;
  releaseStatus: string | null;
  commissionRate: number;
  platformFee: number;
  sellerEarnings: number;
  autoRefundAt: string | null;
  autoReleaseAt: string | null;
  releasedAt: string | null;
  refundedAt: string | null;
  trackingNumber: string | null;
  carrier: string | null;
  shippedAt: string | null;
  deliveredAt: string | null;
  cancelReason: string | null;
  statusHistory: Array<{ status: string; note?: string; changedAt: string }>;
  createdAt: string;
  updatedAt: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  transactionRef: string | null;
  processedAt: string | null;
  createdAt: string;
}

const statusIcon: Record<string, any> = {
  pending: Clock,
  confirmed: CheckCircle,
  processing: Package,
  shipped: Truck,
  delivered: CheckCircle,
  cancelled: XCircle,
};

const statusColor: Record<string, string> = {
  pending: "bg-[#f59e0b]",
  confirmed: "bg-[#8b5cf6]",
  processing: "bg-[#3b82f6]",
  shipped: "bg-[#429DFE]",
  delivered: "bg-[#10b981]",
  cancelled: "bg-[#ef4444]",
};

const releaseLabel: Record<string, string> = {
  held: "Held in Escrow",
  released: "Released to Seller",
  refunded: "Refunded to Buyer",
};

const releaseColor: Record<string, string> = {
  held: "bg-[#f59e0b]",
  released: "bg-[#10b981]",
  refunded: "bg-[#429DFE]",
};

const txTypeIcon: Record<string, any> = {
  payment: DollarSign,
  commission: TrendingUp,
  payout: Truck,
  refund: RotateCcw,
};

export default function AdminOrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: orderId } = use(params);
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [buyer, setBuyer] = useState<{ id: string; username: string; email: string } | null>(null);
  const [tenant, setTenant] = useState<{ id: string; name: string; slug: string; payoutMethod: string; payoutAccount: string } | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isAdmin = user?.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }
    if (!isAdmin) {
      router.replace("/account");
      return;
    }
  }, [isHydrated, isAuthenticated, user, isAdmin, router]);

  useEffect(() => {
    if (!isAdmin || !orderId) return;
    fetchOrder();
  }, [isAdmin, orderId]);

  const fetchOrder = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      const json = await res.json();
      if (res.ok) {
        setOrder(json.order);
        setBuyer(json.buyer);
        setTenant(json.tenant);
        setTransactions(json.transactions || []);
      }
    } catch (err) {
      console.error("Failed to fetch order:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isHydrated || !isAuthenticated || !user || !isAdmin) return null;
  if (isLoading) return <div className="flex justify-center py-20"><Clock className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!order) return <div className="text-center py-20"><p className="text-text-secondary">Order not found</p></div>;

  const StatusIcon = statusIcon[order.status] || Clock;

  return (
    <AdminLayout title={`Order #${order.id.slice(-6).toUpperCase()}`} subtitle="Order details & escrow status">
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={() => router.push("/super-admin/orders")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Back
            </Button>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">
                Order #{order.id.slice(-6).toUpperCase()}
              </h2>
              <p className="text-xs text-text-secondary">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${statusColor[order.status] || "bg-gray-400"} text-white border-0`}>
              <StatusIcon className="w-3 h-3 mr-1" />
              {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
            </Badge>
            {order.releaseStatus && (
              <Badge className={`${releaseColor[order.releaseStatus] || "bg-gray-400"} text-white border-0`}>
                {releaseLabel[order.releaseStatus]}
              </Badge>
            )}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: Order details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Items */}
          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-4">Items</h3>
            <div className="space-y-3">
              {(order.items ?? []).map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.10)]">
                  <div className="w-12 h-12 rounded-lg bg-[rgba(66,157,254,0.08)] flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{item.name}</p>
                    <p className="text-xs text-text-secondary">Store: {item.tenantSlug}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{formatCurrency(item.price)}</p>
                    <p className="text-xs text-text-secondary">Qty: {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Payment Breakdown */}
          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-4">Payment Breakdown</h3>
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
                <span>Total (Buyer Paid)</span>
                <span className="text-primary">{formatCurrency(order.total)}</span>
              </div>
              {order.platformFee > 0 && (
                <>
                  <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="text-[#10b981] font-semibold">Platform Fee ({order.commissionRate}%)</span>
                    <span className="text-[#10b981] font-semibold">{formatCurrency(order.platformFee)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-text-secondary">Seller Earnings</span>
                    <span>{formatCurrency(order.sellerEarnings)}</span>
                  </div>
                </>
              )}
            </div>
          </Card>

          {/* Transaction History */}
          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-4">Transaction History</h3>
            {transactions.length === 0 ? (
              <p className="text-sm text-text-secondary">No transactions yet.</p>
            ) : (
              <div className="space-y-3">
                {transactions.map((t) => {
                  const TxIcon = txTypeIcon[t.type] || DollarSign;
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.10)]">
                      <div className="w-9 h-9 rounded-lg bg-[rgba(66,157,254,0.08)] flex items-center justify-center">
                        <TxIcon className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{t.description}</p>
                        <p className="text-xs text-text-secondary">{new Date(t.createdAt).toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold">{formatCurrency(t.amount)}</p>
                        <Badge className={`${t.status === "completed" ? "bg-[#10b981]" : t.status === "pending" ? "bg-[#f59e0b]" : "bg-[#ef4444]"} text-white border-0 text-xs`}>
                          {t.status}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Status History */}
          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-4">Status Timeline</h3>
            <div className="space-y-3">
              {(order.statusHistory ?? []).map((h, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-[rgba(66,157,254,0.10)] flex items-center justify-center mt-0.5">
                    {(() => { const I = statusIcon[h.status] || Clock; return <I className="w-4 h-4 text-primary" />; })()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{h.status.charAt(0).toUpperCase() + h.status.slice(1)}</p>
                    {h.note && <p className="text-xs text-text-secondary">{h.note}</p>}
                    <p className="text-xs text-text-secondary">{new Date(h.changedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Right column: Info panels */}
        <div className="space-y-6">
          {/* Buyer Info */}
          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-3">Buyer</h3>
            {buyer ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-semibold">{buyer.username}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-text-secondary" />
                  <span className="text-xs text-text-secondary">{buyer.email}</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-text-secondary">Buyer info not available</p>
            )}
          </Card>

          {/* Seller Info */}
          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-3">Seller</h3>
            {tenant ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm font-semibold">{tenant.name}</span>
                </div>
                <p className="text-xs text-text-secondary">Slug: {tenant.slug}</p>
                <p className="text-xs text-text-secondary">Payout: {tenant.payoutMethod} — {tenant.payoutAccount || "Not set"}</p>
              </div>
            ) : (
              <p className="text-xs text-text-secondary">Seller info not available</p>
            )}
          </Card>

          {/* Escrow Status */}
          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-tight mb-3">Escrow Status</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-text-secondary" />
                <span className="text-sm">Funds: </span>
                <Badge className={`${releaseColor[order.releaseStatus || "held"] || "bg-gray-400"} text-white border-0 text-xs`}>
                  {releaseLabel[order.releaseStatus || "held"]}
                </Badge>
              </div>
              {order.paymentStatus && (
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm">Payment: </span>
                  <Badge variant="outline" className="text-xs">{order.paymentStatus}</Badge>
                </div>
              )}
              {order.autoRefundAt && (
                <p className="text-xs text-text-secondary">
                  Auto-refund deadline: {new Date(order.autoRefundAt).toLocaleString()}
                </p>
              )}
              {order.autoReleaseAt && (
                <p className="text-xs text-text-secondary">
                  Auto-release deadline: {new Date(order.autoReleaseAt).toLocaleString()}
                </p>
              )}
              {order.releasedAt && (
                <p className="text-xs text-[#10b981]">
                  Released at: {new Date(order.releasedAt).toLocaleString()}
                </p>
              )}
              {order.refundedAt && (
                <p className="text-xs text-[#429DFE]">
                  Refunded at: {new Date(order.refundedAt).toLocaleString()}
                </p>
              )}
            </div>
          </Card>

          {/* Tracking */}
          {(order.trackingNumber || order.carrier) && (
            <Card className="p-6">
              <h3 className="text-sm font-black uppercase tracking-tight mb-3">Tracking</h3>
              {order.trackingNumber && <p className="text-sm font-semibold">{order.trackingNumber}</p>}
              {order.carrier && <p className="text-xs text-text-secondary">{order.carrier}</p>}
              {order.shippedAt && <p className="text-xs text-text-secondary">Shipped: {new Date(order.shippedAt).toLocaleString()}</p>}
              {order.deliveredAt && <p className="text-xs text-[#10b981]">Delivered: {new Date(order.deliveredAt).toLocaleString()}</p>}
            </Card>
          )}

          {/* Cancel Reason */}
          {order.cancelReason && (
            <Card className="p-6 border border-[rgba(239,68,68,0.3)]">
              <h3 className="text-sm font-black uppercase tracking-tight mb-2 text-[#ef4444]">Cancel Reason</h3>
              <p className="text-sm text-text-primary">{order.cancelReason}</p>
            </Card>
          )}
        </div>
      </div>
    </div>
    </AdminLayout>
  );
}

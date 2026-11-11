"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useOrders, OrderStatus } from "@/hooks/useOrders";
import { formatCurrency } from "@/lib/utils";
import { CreditCard, TrendingUp, Package, ShoppingBag, ChevronRight, Receipt } from "lucide-react";

function StatusBadge({ status }: { status: OrderStatus }) {
  const variants: Record<string, "success" | "warning" | "outline" | "info"> = {
    processing: "warning",
    shipped: "info",
    delivered: "success",
    cancelled: "outline",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

export default function AccountPaymentsPage() {
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { orders, totals, isLoading } = useOrders(user?.id);

  const paidOrders = useMemo(
    () => orders.filter((o) => o.status !== "cancelled"),
    [orders]
  );

  const totalPaid = useMemo(
    () => paidOrders.reduce((sum, o) => sum + o.total, 0),
    [paidOrders]
  );

  const avgOrder = paidOrders.length > 0 ? Math.round(totalPaid / paidOrders.length) : 0;

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6 border border-[rgba(66,157,254,0.2)] bg-gradient-to-br from-[rgba(66,157,254,0.06)] to-[rgba(255,255,255,0.70)]">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(66,157,254,0.12)] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#429DFE]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Payments</h2>
              <p className="text-sm text-text-secondary mt-0.5">Your payment history and spending overview</p>
            </div>
          </div>
          <Link href="/account/orders">
            <Button variant="secondary" size="sm"><Package className="w-4 h-4 mr-1" />View All Orders</Button>
          </Link>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-[rgba(66,157,254,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(66,157,254,0.12)] flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-[#429DFE]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Total Spent</p>
              <p className="text-lg font-black">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-[rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(16,185,129,0.12)] flex items-center justify-center">
              <Receipt className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Paid Orders</p>
              <p className="text-lg font-black">{paidOrders.length}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-[rgba(139,92,246,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.12)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Avg. Order</p>
              <p className="text-lg font-black">{avgOrder > 0 ? formatCurrency(avgOrder) : "—"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-[rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(245,158,11,0.12)] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Active</p>
              <p className="text-lg font-black">{totals.openOrders}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Payment History */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-tight">Payment History</h3>
          <Link href="/account/orders" className="text-xs font-bold text-[#429DFE] hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>

        {isLoading ? (
          <div className="py-8 text-center">
            <p className="text-sm font-bold text-text-secondary">Loading...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="py-8 text-center">
            <CreditCard className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-text-secondary">No payments yet</p>
            <p className="text-xs text-text-secondary mt-1">Your payment history will appear here after your first order</p>
            <Link href="/products" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 10).map((o) => {
              const orderNumber = `ORD-${new Date(o.createdAt).getFullYear()}-${o.id.slice(-6).toUpperCase()}`;
              const itemCount = o.items.reduce((sum, i) => sum + i.quantity, 0);
              return (
                <Link key={o.id} href={`/account/orders/${o.id}`} className="block">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.06)] hover:shadow-md hover:border-[rgba(66,157,254,0.2)] transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(66,157,254,0.08)] flex items-center justify-center shrink-0">
                      <Receipt className="w-5 h-5 text-[#429DFE]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{orderNumber}</p>
                      <p className="text-xs text-text-secondary">
                        {new Date(o.createdAt).toLocaleDateString()} • {itemCount} item{itemCount !== 1 ? "s" : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1">
                      <p className="text-sm font-black">{formatCurrency(o.total)}</p>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

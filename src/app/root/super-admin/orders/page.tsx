"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { useAdminOrders, type AdminOrderStatus } from "@/hooks/useAdminOrders";
import { formatCurrency } from "@/lib/utils";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Search, Package, Truck, CheckCircle, XCircle, Clock, DollarSign } from "lucide-react";

function StatusBadge({ status }: { status: AdminOrderStatus }) {
  if (status === "delivered") return <Badge className="bg-[#10b981] text-white border-0">Delivered</Badge>;
  if (status === "shipped") return <Badge className="bg-[#429DFE] text-white border-0">Shipped</Badge>;
  if (status === "cancelled") return <Badge className="bg-[#ef4444] text-white border-0">Cancelled</Badge>;
  return <Badge className="bg-[#f59e0b] text-white border-0">Processing</Badge>;
}

export default function AdminOrdersPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { orders, isLoading, error, patchOrder } = useAdminOrders();

  const [query, setQuery] = useState("");

  const isAdmin = user?.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }
    if (!isAdmin) {
      router.replace("/account");
    }
  }, [isHydrated, isAuthenticated, user, isAdmin, router]);

  const allOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return orders;
    return orders.filter((o) => {
      const tail = o.id.slice(-6).toLowerCase();
      return (
        o.userId.toLowerCase().includes(normalized) ||
        tail.includes(normalized) ||
        o.status.toLowerCase().includes(normalized)
      );
    });
  }, [query, orders]);

  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(o => o.status === "delivered").length;
    const processing = orders.filter(o => o.status === "processing").length;
    const shipped = orders.filter(o => o.status === "shipped").length;
    const cancelled = orders.filter(o => o.status === "cancelled").length;
    const revenue = orders.filter(o => o.status !== "cancelled" && o.paymentStatus === "paid").reduce((sum, o) => sum + (o.platformFee > 0 ? o.platformFee : Math.round(o.total * 0.1)), 0);
    return { total, delivered, processing, shipped, cancelled, revenue };
  }, [orders]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;
  if (!isAdmin) return null;

  const updateStatus = (orderId: string, status: AdminOrderStatus) => {
    void patchOrder(orderId, { status });
  };

  return (
    <AdminLayout title="Orders" subtitle="Manage all platform orders">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card variant="default" className="p-4 border border-[rgba(255,255,255,0.35)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(46,144,250,0.15)] flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Total</p>
                <p className="text-xl font-bold text-text-primary">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(245,158,11,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Processing</p>
                <p className="text-xl font-bold text-warning">{stats.processing}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(155,81,224,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(155,81,224,0.15)] flex items-center justify-center">
                <Truck className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Shipped</p>
                <p className="text-xl font-bold text-accent">{stats.shipped}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Delivered</p>
                <p className="text-xl font-bold text-success">{stats.delivered}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                <XCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Cancelled</p>
                <p className="text-xl font-bold text-error">{stats.cancelled}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Commission</p>
                <p className="text-xl font-bold text-success">{formatCurrency(stats.revenue)}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card variant="elevated" className="p-4 border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              placeholder="Search by userId, order id, status..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11"
            />
          </div>
        </Card>

        {/* Orders Table */}
        <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgba(255,255,255,0.50)] border-b border-[rgba(255,255,255,0.35)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Order</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Escrow</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Total</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Commission</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.35)]">
                {error ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-secondary">{error}</td>
                  </tr>
                ) : isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-secondary">Loading...</td>
                  </tr>
                ) : allOrders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-text-secondary">No orders available.</td>
                  </tr>
                ) : (
                  allOrders.map((o) => {
                    const items = (o.items ?? []).reduce((sum: number, it: any) => sum + (it?.quantity ?? 0), 0);
                    const orderNumber = `ORD-${new Date(o.createdAt).getFullYear()}-${o.id.slice(-6).toUpperCase()}`;
                    return (
                      <tr key={o.id} className="hover:bg-[rgba(255,255,255,0.30)] transition-colors cursor-pointer" onClick={() => router.push(`/super-admin/orders/${o.id}`)}>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-semibold text-primary hover:underline">{orderNumber}</p>
                            <p className="text-xs text-text-secondary">{new Date(o.createdAt).toLocaleDateString()} • {items} items</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <StatusBadge status={o.status} />
                        </td>
                        <td className="px-6 py-4">
                          {o.releaseStatus ? (
                            <Badge className={`${o.releaseStatus === 'released' ? 'bg-[#10b981]' : o.releaseStatus === 'refunded' ? 'bg-[#429DFE]' : 'bg-[#f59e0b]'} text-white border-0 text-xs`}>
                              {o.releaseStatus === 'held' ? 'Escrow' : o.releaseStatus === 'released' ? 'Released' : 'Refunded'}
                            </Badge>
                          ) : (
                            <span className="text-xs text-text-secondary">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm font-bold text-text-primary">{formatCurrency(o.total)}</p>
                        </td>
                        <td className="px-6 py-4">
                          {(o.platformFee ?? 0) > 0 ? (
                            <p className="text-sm font-bold text-[#10b981]">{formatCurrency(o.platformFee)}</p>
                          ) : (
                            <span className="text-xs text-text-secondary">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-2">
                            <Button variant="outline" size="sm" onClick={() => updateStatus(o.id, "processing")}>
                              Processing
                            </Button>
                            <Button variant="secondary" size="sm" onClick={() => updateStatus(o.id, "shipped")}>
                              Shipped
                            </Button>
                            <Button variant="primary" size="sm" onClick={() => updateStatus(o.id, "delivered")}>
                              Delivered
                            </Button>
                            <Button variant="destructive" size="sm" onClick={() => updateStatus(o.id, "cancelled")}>
                              Cancel
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

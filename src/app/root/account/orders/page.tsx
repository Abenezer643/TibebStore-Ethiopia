"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useOrders, type Order, type OrderStatus } from "@/hooks/useOrders";
import { Package, ShoppingBag, ChevronRight } from "lucide-react";

function StatusBadge({ status }: { status: OrderStatus }) {
  const variants: Record<string, "success" | "warning" | "outline" | "info"> = {
    processing: "warning",
    shipped: "info",
    delivered: "success",
    cancelled: "outline",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

function OrderRow({ order, isSelected, onSelect }: { order: Order; isSelected: boolean; onSelect: () => void }) {
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);
  
  // Generate user-friendly order number
  const orderNumber = `ORD-${new Date(order.createdAt).getFullYear()}-${order.id.slice(-6).toUpperCase()}`;

  return (
    <button
      type="button"
      onClick={onSelect}
      className={
        "w-full text-left rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md p-4 transition-all hover:shadow-lg cursor-pointer " +
        (isSelected ? "bg-[rgba(66,157,254,0.10)] border-primary" : "hover:bg-[rgba(255,255,255,0.80)]")
      }
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-black uppercase tracking-tight">{orderNumber}</p>
          <p className="mt-1 text-xs font-bold text-text-secondary uppercase">
            {new Date(order.createdAt).toLocaleDateString()} • {itemCount} item{itemCount === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusBadge status={order.status} />
          <p className="text-sm font-black">{formatCurrency(order.total)}</p>
        </div>
      </div>
    </button>
  );
}

export default function AccountOrdersPage() {
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { orders, totals, updateStatus } = useOrders(user?.id);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => orders.find((o) => o.id === selectedId) ?? null, [orders, selectedId]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  const ensureSelected = () => {
    if (selectedId) return;
    if (orders.length > 0) setSelectedId(orders[0].id);
  };

  return (
    <div className="space-y-6" onMouseEnter={ensureSelected}>
      <Card className="p-6 border border-[rgba(66,157,254,0.2)] bg-gradient-to-br from-[rgba(66,157,254,0.06)] to-[rgba(255,255,255,0.70)]">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(66,157,254,0.12)] flex items-center justify-center">
              <Package className="w-5 h-5 text-[#429DFE]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Orders</h2>
              <p className="text-sm text-text-secondary mt-0.5">
                {totals.count} total • {totals.openOrders} active
              </p>
            </div>
          </div>
          <Link href="/products">
            <Button variant="secondary" size="sm"><ShoppingBag className="w-4 h-4 mr-1" />Continue Shopping</Button>
          </Link>
        </div>
      </Card>

      {orders.length === 0 ? (
        <Card className="p-6">
          <div className="py-8 text-center">
            <Package className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-text-secondary">No orders yet</p>
            <p className="text-xs text-text-secondary mt-1">Your order history will appear here after your first purchase</p>
            <Link href="/products" className="mt-4 inline-block">
              <Button variant="secondary" size="sm">Start Shopping</Button>
            </Link>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-tight">Order History</h3>
            <div className="mt-4 space-y-3">
              {orders.map((o) => (
                <OrderRow
                  key={o.id}
                  order={o}
                  isSelected={o.id === selectedId}
                  onSelect={() => setSelectedId(o.id)}
                />
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-sm font-black uppercase tracking-tight">Order Details</h3>

            {!selected ? (
              <div className="mt-4 rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md p-4">
                <p className="text-sm font-bold text-text-secondary">Select an order.</p>
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">
                        {`ORD-${new Date(selected.createdAt).getFullYear()}-${selected.id.slice(-6).toUpperCase()}`}
                      </p>
                      <p className="mt-1 text-xs font-bold text-text-secondary uppercase">
                        Placed {new Date(selected.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <StatusBadge status={selected.status} />
                  </div>

                  <div className="mt-4 space-y-3">
                    {selected.items.map((it) => (
                      <div key={it.id} className="flex items-center gap-4 rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md p-3">
                        <div className="h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-[rgba(15,23,42,0.10)]">
                          {it.productImageUrl ? (
                            <img src={it.productImageUrl} alt={it.productName} className="h-full w-full object-cover" />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-black uppercase tracking-tight line-clamp-1">{it.productName}</p>
                          <p className="text-xs font-bold text-text-secondary uppercase">
                            {it.quantity} × {formatCurrency(it.unitPrice)}
                          </p>
                        </div>
                        <p className="text-sm font-black">{formatCurrency(it.unitPrice * it.quantity)}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md p-4">
                  <div className="flex items-center justify-between text-xs font-bold text-text-secondary uppercase">
                    <span>Subtotal</span>
                    <span className="text-text-primary">{formatCurrency(selected.subtotal)}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs font-bold text-text-secondary uppercase">
                    <span>Shipping</span>
                    <span className="text-text-primary">{formatCurrency(selected.shippingFee)}</span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-sm font-black uppercase tracking-tight">
                    <span>Total</span>
                    <span>{formatCurrency(selected.total)}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <Link href={`/account/orders/${selected.id}`}>
                    <Button variant="secondary" className="w-full">
                      View Order Details
                    </Button>
                  </Link>
                  {selected.status !== "cancelled" ? (
                    <Button variant="outline" onClick={() => updateStatus(selected.id, "cancelled")}>
                      Cancel Order
                    </Button>
                  ) : null}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
}

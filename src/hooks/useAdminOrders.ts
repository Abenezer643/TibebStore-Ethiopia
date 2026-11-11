"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AdminOrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export type AdminOrder = {
  id: string;
  userId: string;
  status: AdminOrderStatus;
  items: any[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  paymentStatus: string;
  releaseStatus: string | null;
  platformFee: number;
  sellerEarnings: number;
  commissionRate: number;
  createdAt: string;
  updatedAt: string;
};

export function useAdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/orders", { method: "GET" });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to load orders");
      setOrders(Array.isArray(json?.orders) ? json.orders : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const patchOrder = useCallback(async (id: string, patch: { status: AdminOrderStatus }) => {
    const res = await fetch(`/api/admin/orders/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) throw new Error(json?.error ?? "Failed to update order");

    const updated = json?.order as AdminOrder | undefined;
    if (updated) setOrders((prev) => prev.map((o) => (o.id === updated.id ? updated : o)));

    return updated;
  }, []);

  const value = useMemo(() => ({ orders, isLoading, error, refresh, patchOrder }), [orders, isLoading, error, refresh, patchOrder]);
  return value;
}

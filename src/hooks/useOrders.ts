"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type OrderStatus = "processing" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productImageUrl?: string;
  unitPrice: number;
  quantity: number;
  tenantSlug: string;
}

export interface ShippingAddressSnapshot {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode?: string;
}

export interface Order {
  id: string;
  userId: string;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
}

export function useOrders(userId?: string) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  const refresh = useCallback(async () => {
    if (!userId) {
      setOrders([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/orders", { method: "GET" });
      const json = await res.json().catch(() => null);
      if (res.ok && Array.isArray(json?.orders)) {
        setOrders(json.orders);
      } else {
        setOrders([]);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isHydrated && userId) {
      refresh();
    }
  }, [isHydrated, userId, refresh]);

  const getById = useCallback(
    (id: string) => orders.find((o) => o.id === id) ?? null,
    [orders]
  );

  const updateStatus = useCallback(
    async (id: string, status: OrderStatus) => {
      if (!userId) return;
      
      try {
        const res = await fetch(`/api/orders/${encodeURIComponent(id)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        });
        
        if (res.ok) {
          // Update local state
          setOrders((prev) =>
            prev.map((o) =>
              o.id === id ? { ...o, status, updatedAt: new Date().toISOString() } : o
            )
          );
        }
      } catch (error) {
        console.error("Failed to update order status:", error);
      }
    },
    [userId]
  );

  const totals = useMemo(() => {
    const totalSpent = orders
      .filter((o) => o.status !== "cancelled")
      .reduce((sum, o) => sum + o.total, 0);
    const openOrders = orders.filter((o) => o.status === "processing" || o.status === "shipped").length;
    return { totalSpent, openOrders, count: orders.length };
  }, [orders]);

  return { orders, isLoading, isHydrated, getById, updateStatus, totals, refresh };
}

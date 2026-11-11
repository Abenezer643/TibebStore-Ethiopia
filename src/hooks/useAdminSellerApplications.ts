"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type SellerApplicationStatus = "pending" | "approved" | "rejected";

export type SellerApplication = {
  id: string;
  userId: string;
  email: string;
  username: string;
  storeName: string;
  storeSlug: string;
  phone: string;
  country: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  payoutMethod: "bank" | "paypal";
  payoutAccount: string;
  idDocumentName?: string;
  status: SellerApplicationStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewNotes?: string;
  createdAt: string;
  updatedAt: string;
};

export function useAdminSellerApplications(status?: SellerApplicationStatus) {
  const [applications, setApplications] = useState<SellerApplication[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = status ? `/api/admin/seller-applications?status=${status}` : "/api/admin/seller-applications";
      const res = await fetch(url, { method: "GET" });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to load applications");
      setApplications(Array.isArray(json?.applications) ? json.applications : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load applications");
    } finally {
      setIsLoading(false);
    }
  }, [status]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const review = useCallback(async (id: string, patch: { status: SellerApplicationStatus; reviewNotes?: string }) => {
    const res = await fetch(`/api/admin/seller-applications/${encodeURIComponent(id)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) throw new Error(json?.error ?? "Failed to review application");

    const updated = json?.application as SellerApplication | undefined;
    if (updated) {
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    } else {
      await refresh();
    }

    return updated;
  }, [refresh]);

  const value = useMemo(() => ({ applications, isLoading, error, refresh, review }), [applications, isLoading, error, refresh, review]);
  return value;
}

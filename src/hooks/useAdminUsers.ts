"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type AdminUser = {
  id: string;
  email: string;
  username: string;
  role: "user" | "seller" | "super-admin";
  sellerStatus: "none" | "pending" | "approved" | "rejected";
  isSuspended: boolean;
  createdAt: string;
  updatedAt: string;
};

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", { method: "GET" });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to load users");
      setUsers(Array.isArray(json?.users) ? json.users : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const patchUser = useCallback(async (idOrEmail: string, patch: Partial<Pick<AdminUser, "role" | "sellerStatus" | "isSuspended">>) => {
    const res = await fetch(`/api/admin/users/${encodeURIComponent(idOrEmail)}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) throw new Error(json?.error ?? "Failed to update user");

    const updated = json?.user as AdminUser | undefined;
    if (updated) {
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } else {
      await refresh();
    }

    return updated;
  }, [refresh]);

  const value = useMemo(() => ({ users, isLoading, error, refresh, patchUser }), [users, isLoading, error, refresh, patchUser]);
  return value;
}

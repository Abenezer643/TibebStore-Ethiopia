"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type SellerControl = {
  userId: string;
  isSuspended: boolean;
  updatedAt: string;
};

const KEY = "tibeb_admin_seller_controls_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAll(): Record<string, SellerControl> {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<Record<string, SellerControl>>(localStorage.getItem(KEY));
  return parsed && typeof parsed === "object" ? parsed : {};
}

function writeAll(map: Record<string, SellerControl>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function useAdminSellerControls() {
  const [controls, setControls] = useState<Record<string, SellerControl>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setControls(readAll());
    setIsHydrated(true);
  }, []);

  const refresh = useCallback(() => {
    setControls(readAll());
  }, []);

  const setSuspended = useCallback((userId: string, isSuspended: boolean) => {
    const nextAll = readAll();
    nextAll[userId] = { userId, isSuspended, updatedAt: new Date().toISOString() };
    writeAll(nextAll);
    setControls(nextAll);
  }, []);

  const isSellerSuspended = useCallback(
    (userId: string) => !!controls[userId]?.isSuspended,
    [controls]
  );

  const value = useMemo(
    () => ({ controls, isHydrated, refresh, setSuspended, isSellerSuspended }),
    [controls, isHydrated, refresh, setSuspended, isSellerSuspended]
  );

  return value;
}

export function readIsSellerSuspended(userId: string) {
  if (typeof window === "undefined") return false;
  const parsed = safeParse<Record<string, SellerControl>>(localStorage.getItem(KEY)) ?? {};
  return !!parsed[userId]?.isSuspended;
}

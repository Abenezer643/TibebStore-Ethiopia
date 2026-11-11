"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type ProductVisibilityOverride = {
  productId: string;
  isArchived?: boolean;
  isPrivate?: boolean;
  updatedAt: string;
};

const KEY = "tibeb_admin_product_overrides_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAll(): Record<string, ProductVisibilityOverride> {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<Record<string, ProductVisibilityOverride>>(localStorage.getItem(KEY));
  return parsed && typeof parsed === "object" ? parsed : {};
}

function writeAll(map: Record<string, ProductVisibilityOverride>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function useAdminProductOverrides() {
  const [overrides, setOverrides] = useState<Record<string, ProductVisibilityOverride>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setOverrides(readAll());
    setIsHydrated(true);
  }, []);

  const refresh = useCallback(() => {
    setOverrides(readAll());
  }, []);

  const setOverride = useCallback((productId: string, patch: { isArchived?: boolean; isPrivate?: boolean }) => {
    const nextAll = readAll();
    const current = nextAll[productId] ?? { productId, updatedAt: new Date().toISOString() };
    nextAll[productId] = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeAll(nextAll);
    setOverrides(nextAll);
  }, []);

  const clearOverride = useCallback((productId: string) => {
    const nextAll = readAll();
    delete nextAll[productId];
    writeAll(nextAll);
    setOverrides(nextAll);
  }, []);

  const getOverride = useCallback(
    (productId: string) => overrides[productId] ?? null,
    [overrides]
  );

  const value = useMemo(
    () => ({ overrides, isHydrated, refresh, getOverride, setOverride, clearOverride }),
    [overrides, isHydrated, refresh, getOverride, setOverride, clearOverride]
  );

  return value;
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export type TenantOverride = {
  tenantId: string;
  isDisabled?: boolean;
  updatedAt: string;
};

const KEY = "tibeb_admin_tenant_overrides_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAll(): Record<string, TenantOverride> {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<Record<string, TenantOverride>>(localStorage.getItem(KEY));
  return parsed && typeof parsed === "object" ? parsed : {};
}

function writeAll(map: Record<string, TenantOverride>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(map));
}

export function useAdminTenantOverrides() {
  const [overrides, setOverrides] = useState<Record<string, TenantOverride>>({});
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setOverrides(readAll());
    setIsHydrated(true);
  }, []);

  const refresh = useCallback(() => {
    setOverrides(readAll());
  }, []);

  const setOverride = useCallback((tenantId: string, patch: { isDisabled?: boolean }) => {
    const nextAll = readAll();
    const current = nextAll[tenantId] ?? { tenantId, updatedAt: new Date().toISOString() };
    nextAll[tenantId] = {
      ...current,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    writeAll(nextAll);
    setOverrides(nextAll);
  }, []);

  const clearOverride = useCallback((tenantId: string) => {
    const nextAll = readAll();
    delete nextAll[tenantId];
    writeAll(nextAll);
    setOverrides(nextAll);
  }, []);

  const getOverride = useCallback(
    (tenantId: string) => overrides[tenantId] ?? null,
    [overrides]
  );

  const value = useMemo(
    () => ({ overrides, isHydrated, refresh, getOverride, setOverride, clearOverride }),
    [overrides, isHydrated, refresh, getOverride, setOverride, clearOverride]
  );

  return value;
}

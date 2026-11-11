"use client";

import type { Product, Tenant } from "@/types";
import { MOCK_PRODUCTS, MOCK_TENANTS } from "@/types/mock-data";

type ProductOverrideMap = Record<string, { productId: string; isArchived?: boolean; isPrivate?: boolean }>;
const PRODUCT_KEY = "tibeb_admin_product_overrides_v1";

type TenantOverrideMap = Record<string, { tenantId: string; isDisabled?: boolean }>;
const TENANT_KEY = "tibeb_admin_tenant_overrides_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

const TENANTS_KEY = "tibeb_tenants_v1";

export function readBaseTenants(): Tenant[] {
  if (typeof window === "undefined") return MOCK_TENANTS;
  const raw = localStorage.getItem(TENANTS_KEY);
  if (!raw) {
    localStorage.setItem(TENANTS_KEY, JSON.stringify(MOCK_TENANTS));
    return MOCK_TENANTS;
  }
  const parsed = safeParse<Tenant[]>(raw);
  return Array.isArray(parsed) ? parsed : MOCK_TENANTS;
}

export function readProductOverrideMap(): ProductOverrideMap {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<ProductOverrideMap>(localStorage.getItem(PRODUCT_KEY));
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function readTenantOverrideMap(): TenantOverrideMap {
  if (typeof window === "undefined") return {};
  const parsed = safeParse<TenantOverrideMap>(localStorage.getItem(TENANT_KEY));
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function getEffectiveProducts(): Product[] {
  const overrides = readProductOverrideMap();
  return MOCK_PRODUCTS.map((p) => {
    const o = overrides[p.id];
    if (!o) return p;
    return {
      ...p,
      isArchived: typeof o.isArchived === "boolean" ? o.isArchived : p.isArchived,
      isPrivate: typeof o.isPrivate === "boolean" ? o.isPrivate : p.isPrivate,
    };
  });
}

export function getEffectiveTenants(): Array<Tenant & { isDisabled?: boolean }> {
  const overrides = readTenantOverrideMap();
  const base = readBaseTenants();
  return base.map((t) => {
    const o = overrides[t.id];
    return {
      ...t,
      isDisabled: o?.isDisabled,
    };
  });
}

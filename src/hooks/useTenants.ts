"use client";

import type { Tenant } from "@/types";
import { MOCK_TENANTS } from "@/types/mock-data";
import { useCallback, useEffect, useMemo, useState } from "react";

const KEY = "tibeb_tenants_v1";

function safeParse<T>(raw: string | null): T |null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function readAll(): Tenant[] {
  if (typeof window === "undefined") return [];
  const parsed = safeParse<Tenant[]>(localStorage.getItem(KEY));
  return Array.isArray(parsed) ? parsed : [];
}

function writeAll(next: Tenant[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(next));
}

function seedIfMissing() {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(KEY);
  if (raw) return;
  writeAll(MOCK_TENANTS);
}

function makeId() {
  return `t_${Math.random().toString(16).slice(2)}_${Date.now().toString(16)}`;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    seedIfMissing();
    setTenants(readAll());
    setIsHydrated(true);
  }, []);

  const refresh = useCallback(() => {
    setTenants(readAll());
  }, []);

  const createTenant = useCallback(
    (input: { name: string; slug?: string; description?: string; ownerId?: string }) => {
      const now = new Date().toISOString();
      const current = readAll();

      const name = input.name.trim();
      const slug = (input.slug ? slugify(input.slug) : slugify(name)).trim();
      if (!name) throw new Error("Tenant name is required");
      if (!slug) throw new Error("Tenant slug is required");
      if (current.some((t) => t.slug.toLowerCase() === slug.toLowerCase())) {
        throw new Error("Tenant slug must be unique");
      }

      const next: Tenant = {
        id: makeId(),
        name,
        slug,
        description: input.description?.trim() || "",
        stripeDetailsSubmitted: false,
        ownerId: input.ownerId?.trim() || "admin",
        createdAt: now,
        updatedAt: now,
      };

      const nextAll = [next, ...current];
      writeAll(nextAll);
      setTenants(nextAll);
      return next;
    },
    []
  );

  const updateTenant = useCallback(
    (tenantId: string, patch: { name?: string; slug?: string; description?: string; ownerId?: string }) => {
      const now = new Date().toISOString();
      const current = readAll();
      const existing = current.find((t) => t.id === tenantId);
      if (!existing) throw new Error("Tenant not found");

      const nextName = typeof patch.name === "string" ? patch.name.trim() : existing.name;
      const nextSlug = typeof patch.slug === "string" ? slugify(patch.slug) : existing.slug;

      if (!nextName) throw new Error("Tenant name is required");
      if (!nextSlug) throw new Error("Tenant slug is required");
      if (
        current.some(
          (t) => t.id !== tenantId && t.slug.toLowerCase() === nextSlug.toLowerCase()
        )
      ) {
        throw new Error("Tenant slug must be unique");
      }

      const nextAll = current.map((t) => {
        if (t.id !== tenantId) return t;
        return {
          ...t,
          name: nextName,
          slug: nextSlug,
          description: typeof patch.description === "string" ? patch.description : t.description,
          ownerId: typeof patch.ownerId === "string" ? patch.ownerId : t.ownerId,
          updatedAt: now,
        };
      });
      writeAll(nextAll);
      setTenants(nextAll);
    },
    []
  );

  const deleteTenant = useCallback((tenantId: string) => {
    const current = readAll();
    const nextAll = current.filter((t) => t.id !== tenantId);
    writeAll(nextAll);
    setTenants(nextAll);
  }, []);

  const getTenantBySlug = useCallback((slug: string) => {
    const normalized = slug.trim().toLowerCase();
    return tenants.find((t) => t.slug.toLowerCase() === normalized) ?? null;
  }, [tenants]);

  const value = useMemo(
    () => ({
      tenants,
      isHydrated,
      refresh,
      createTenant,
      updateTenant,
      deleteTenant,
      getTenantBySlug,
    }),
    [tenants, isHydrated, refresh, createTenant, updateTenant, deleteTenant, getTenantBySlug]
  );

  return value;
}

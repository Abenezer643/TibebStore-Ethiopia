"use client";

import { useEffect, useMemo, useState } from "react";
import type { SellerApplication, SellerApplicationStatus } from "@/types/dashboard";
import { type AuthUser, useAuth } from "@/hooks/useAuth";

const SUPER_ADMIN_EMAIL = "admin@tibebstore.com";

const APPS_KEY = "tibeb_seller_applications";

type CreateApplicationInput = {
  storeName: string;
  phone: string;
  country: string;
  city: string;
  addressLine1: string;
  addressLine2?: string;
  payoutMethod: "bank" | "paypal";
  payoutAccount: string;
  idDocumentName?: string;
};

function nowIso() {
  return new Date().toISOString();
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function readApps(): SellerApplication[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(APPS_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SellerApplication[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeApps(apps: SellerApplication[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(APPS_KEY, JSON.stringify(apps));
}

function updateUserSellerStatus(userId: string, status: SellerApplicationStatus) {
  if (typeof window === "undefined") return;
  const key = `tibeb_user_seller_status_${userId}`;
  localStorage.setItem(key, status);
}

export function readUserSellerStatus(userId: string): SellerApplicationStatus | null {
  if (typeof window === "undefined") return null;
  const key = `tibeb_user_seller_status_${userId}`;
  const raw = localStorage.getItem(key);
  if (raw === "pending" || raw === "approved" || raw === "rejected") return raw;
  return null;
}

function getUserApplication(userId: string): SellerApplication | null {
  const apps = readApps();
  return apps.find((a) => a.userId === userId) ?? null;
}

function isSuperAdmin(user: AuthUser | null) {
  return !!user && user.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;
}

export function useSellerApplications() {
  const { user, updateSellerStatus } = useAuth();
  const [apps, setApps] = useState<SellerApplication[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setApps(readApps());
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!user) return;
    const persisted = readUserSellerStatus(user.id);
    if (persisted && persisted !== user.sellerStatus) {
      updateSellerStatus(persisted);
    }
  }, [user, updateSellerStatus]);

  const refresh = () => {
    setApps(readApps());
  };

  const submitApplication = (input: CreateApplicationInput) => {
    if (!user) return;

    const existing = getUserApplication(user.id);

    const base: SellerApplication = {
      id: existing?.id ?? crypto.randomUUID(),
      userId: user.id,
      email: user.email,
      username: user.username,
      storeName: input.storeName,
      storeSlug: slugify(input.storeName),
      phone: input.phone,
      country: input.country,
      city: input.city,
      addressLine1: input.addressLine1,
      addressLine2: input.addressLine2,
      payoutMethod: input.payoutMethod,
      payoutAccount: input.payoutAccount,
      idDocumentName: input.idDocumentName,
      status: "pending",
      submittedAt: existing?.submittedAt ?? nowIso(),
      reviewedAt: undefined,
      reviewNotes: undefined,
    };

    const next = readApps().filter((a) => a.userId !== user.id);
    next.unshift(base);
    writeApps(next);
    setApps(next);
    updateSellerStatus("pending");
  };

  const setApplicationStatus = (applicationId: string, status: SellerApplicationStatus, reviewNotes?: string) => {
    if (!isSuperAdmin(user)) return;

    const next = readApps().map((a) =>
      a.id === applicationId
        ? {
            ...a,
            status,
            reviewedAt: nowIso(),
            reviewNotes: reviewNotes?.trim() || undefined,
          }
        : a
    );

    writeApps(next);
    setApps(next);

    const updated = next.find((a) => a.id === applicationId);
    if (updated) {
      updateUserSellerStatus(updated.userId, status);
      if (user && updated.userId === user.id) {
        updateSellerStatus(status);
      }
    }
  };

  const myApplication = useMemo(() => {
    if (!user) return null;
    return apps.find((a) => a.userId === user.id) ?? null;
  }, [apps, user]);

  const value = useMemo(
    () => ({
      apps,
      isHydrated,
      myApplication,
      submitApplication,
      setApplicationStatus,
      refresh,
    }),
    [apps, isHydrated, myApplication]
  );

  return value;
}

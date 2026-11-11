"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type MediaReference = {
  id: string;
  url: string;
  alt: string;
  width: number;
  height: number;
};

type Role = "user" | "seller" | "super-admin";

type SellerStatus = "none" | "pending" | "approved" | "rejected";

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  role: Role;
  sellerStatus: SellerStatus;
  isSuspended?: boolean;
  avatar?: MediaReference;
  createdAt: string;
  updatedAt: string;
}

export const SUPER_ADMIN_EMAIL = "admin@tibebstore.com";

async function readMe(): Promise<AuthUser | null> {
  const res = await fetch("/api/auth/me", { method: "GET" });
  if (!res.ok) return null;
  const json = (await res.json().catch(() => null)) as null | { user?: AuthUser | null };
  return json?.user ?? null;
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    readMe()
      .then((u) => {
        if (!mounted) return;
        setUser(u);
        setIsHydrated(true);
      })
      .catch(() => {
        if (!mounted) return;
        setUser(null);
        setIsHydrated(true);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const signIn = useCallback(async (input: { email: string; password: string }) => {
    const res = await fetch("/api/auth/sign-in", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: input.email, password: input.password }),
    });

    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      throw new Error(json?.error ?? "Failed to sign in");
    }
    setUser(json?.user ?? null);
    return json?.user as AuthUser;
  }, []);

  const signUp = useCallback(async (input: { email: string; username: string; password: string }) => {
    const res = await fetch("/api/auth/sign-up", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: input.email, username: input.username, password: input.password }),
    });
    const json = (await res.json().catch(() => null)) as any;
    if (!res.ok) {
      throw new Error(json?.error ?? "Failed to sign up");
    }
    setUser(json?.user ?? null);
    return json?.user as AuthUser;
  }, []);

  const signOut = useCallback(async () => {
    await fetch("/api/auth/sign-out", { method: "POST" }).catch(() => null);
    setUser(null);
  }, []);

  const refresh = useCallback(async () => {
    const u = await readMe();
    setUser(u);
    return u;
  }, []);

  const updateSellerStatus = useCallback((_sellerStatus: SellerStatus) => {
    // Seller status will be managed server-side later.
  }, []);

  const value = useMemo(
    () => ({
      user,
      isHydrated,
      isAuthenticated: !!user,
      signIn,
      signUp,
      signOut,
      updateSellerStatus,
      refresh,
    }),
    [user, isHydrated, signIn, signUp, signOut, updateSellerStatus, refresh]
  );

  return value;
}

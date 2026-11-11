"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

export interface Address {
  id: string;
  userId: string;
  label: "home" | "work" | "other";
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  country: string;
  postalCode?: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddressInput = Omit<Address, "id" | "userId" | "isDefault" | "createdAt" | "updatedAt">;

const STORAGE_KEY = "tibeb_addresses_v1";

function safeParse<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function generateId(prefix: string) {
  return `${prefix}_${Math.random().toString(16).slice(2)}_${Date.now()}`;
}

function seedAddressesForUser(userId: string): Address[] {
  const now = new Date().toISOString();
  return [
    {
      id: generateId("addr"),
      userId,
      label: "home",
      fullName: "Abebe Bekele",
      phone: "+251 9 00 00 00 00",
      addressLine1: "Bole Road",
      addressLine2: "Apartment 12",
      city: "Addis Ababa",
      country: "Ethiopia",
      postalCode: "1000",
      isDefault: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function useAddresses(userId?: string) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    const all = safeParse<Address[]>(localStorage.getItem(STORAGE_KEY)) ?? [];

    if (userId) {
      const mine = all.filter((a) => a.userId === userId);
      if (mine.length === 0) {
        const seeded = seedAddressesForUser(userId);
        const nextAll = [...all, ...seeded];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAll));
        setAddresses(seeded);
      } else {
        setAddresses(mine);
      }
    } else {
      setAddresses([]);
    }

    setIsHydrated(true);
  }, [userId]);

  const upsertAll = useCallback(
    (updater: (all: Address[]) => Address[]) => {
      const currentAll = safeParse<Address[]>(localStorage.getItem(STORAGE_KEY)) ?? [];
      const nextAll = updater(currentAll);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nextAll));
      if (userId) {
        setAddresses(nextAll.filter((a) => a.userId === userId));
      }
    },
    [userId]
  );

  const createAddress = useCallback(
    (input: AddressInput) => {
      if (!userId) return;
      const now = new Date().toISOString();

      upsertAll((all) => {
        const hasDefault = all.some((a) => a.userId === userId && a.isDefault);
        const next: Address = {
          id: generateId("addr"),
          userId,
          ...input,
          isDefault: hasDefault ? false : true,
          createdAt: now,
          updatedAt: now,
        };
        return [next, ...all];
      });
    },
    [upsertAll, userId]
  );

  const updateAddress = useCallback(
    (id: string, input: AddressInput) => {
      if (!userId) return;
      const now = new Date().toISOString();

      upsertAll((all) =>
        all.map((a) =>
          a.id === id && a.userId === userId
            ? { ...a, ...input, updatedAt: now }
            : a
        )
      );
    },
    [upsertAll, userId]
  );

  const deleteAddress = useCallback(
    (id: string) => {
      if (!userId) return;

      upsertAll((all) => {
        const mine = all.filter((a) => a.userId === userId);
        const target = mine.find((a) => a.id === id);
        const nextAll = all.filter((a) => !(a.userId === userId && a.id === id));

        if (target?.isDefault) {
          const remainingMine = nextAll.filter((a) => a.userId === userId);
          const first = remainingMine[0];
          if (first) {
            return nextAll.map((a) =>
              a.userId === userId
                ? { ...a, isDefault: a.id === first.id }
                : a
            );
          }
        }

        return nextAll;
      });
    },
    [upsertAll, userId]
  );

  const setDefault = useCallback(
    (id: string) => {
      if (!userId) return;
      upsertAll((all) =>
        all.map((a) =>
          a.userId !== userId ? a : { ...a, isDefault: a.id === id }
        )
      );
    },
    [upsertAll, userId]
  );

  const defaultAddress = useMemo(
    () => addresses.find((a) => a.isDefault) ?? null,
    [addresses]
  );

  return {
    addresses,
    isHydrated,
    defaultAddress,
    createAddress,
    updateAddress,
    deleteAddress,
    setDefault,
  };
}

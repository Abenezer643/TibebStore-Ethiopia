"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { useAdminProductOverrides } from "@/hooks/useAdminProductOverrides";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Search, Package, Archive, Eye, EyeOff, ExternalLink, RefreshCw, Grid, List } from "lucide-react";

export default function AdminProductsPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { getOverride, setOverride, clearOverride } = useAdminProductOverrides();

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const isAdmin = user?.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const patchProduct = async (idOrSlug: string, patch: { isArchived?: boolean; isPrivate?: boolean }) => {
    const res = await fetch(`/api/admin/products/${idOrSlug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as any;
      throw new Error(json?.error ?? "Failed to update product");
    }
    return res;
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }
    if (!isAdmin) {
      router.replace("/account");
    }
  }, [isHydrated, isAuthenticated, user, isAdmin, router]);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) return;
    if (!isAdmin) return;

    let cancelled = false;
    setIsLoading(true);
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((json) => {
        if (cancelled) return;
        setProducts(Array.isArray(json?.products) ? json.products : []);
      })
      .catch(() => {
        if (cancelled) return;
        setProducts([]);
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [isHydrated, isAuthenticated, user, isAdmin]);

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const withTenant = products.map((p) => ({
      ...p,
      tenantName: p.tenantName ?? "Unknown",
      images: Array.isArray(p.images) ? p.images : [],
      category: p.category ?? { name: "Uncategorized", slug: "uncategorized", id: "uncategorized", color: "#2A9D8F" },
    }));

    if (!normalized) return withTenant;
    return withTenant.filter((p: any) => {
      return (
        p.name.toLowerCase().includes(normalized) ||
        p.slug.toLowerCase().includes(normalized) ||
        p.category.name.toLowerCase().includes(normalized) ||
        p.tenantName.toLowerCase().includes(normalized)
      );
    });
  }, [query, products]);

  const stats = useMemo(() => {
    const total = products.length;
    const archived = products.filter(p => getOverride(p.id)?.isArchived ?? p.isArchived).length;
    const active = total - archived;
    const privateCount = products.filter(p => getOverride(p.id)?.isPrivate ?? p.isPrivate).length;
    const publicCount = total - privateCount;
    return { total, archived, active, privateCount, publicCount };
  }, [products, getOverride]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;
  if (!isAdmin) return null;

  return (
    <AdminLayout title="Products" subtitle="Manage marketplace listings">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <Card variant="default" className="p-4 border border-[rgba(255,255,255,0.35)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(46,144,250,0.15)] flex items-center justify-center">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Total</p>
                <p className="text-xl font-bold text-text-primary">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
                <Eye className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Active</p>
                <p className="text-xl font-bold text-success">{stats.active}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(245,158,11,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                <Archive className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Archived</p>
                <p className="text-xl font-bold text-warning">{stats.archived}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(155,81,224,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(155,81,224,0.15)] flex items-center justify-center">
                <EyeOff className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Private</p>
                <p className="text-xl font-bold text-accent">{stats.privateCount}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
                <Eye className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Public</p>
                <p className="text-xl font-bold text-success">{stats.publicCount}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card variant="elevated" className="p-4 border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              placeholder="Search by product, slug, category, tenant..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11"
            />
          </div>
        </Card>

        {/* Products Table */}
        <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          {isLoading ? (
            <div className="p-12 text-center text-sm text-text-secondary">Loading products...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[rgba(255,255,255,0.50)] border-b border-[rgba(255,255,255,0.35)]">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Product</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Category</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(255,255,255,0.35)]">
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-sm text-text-secondary">No products found</td>
                    </tr>
                  ) : (
                    rows.map((p) => {
                      const isArchived = getOverride(p.id)?.isArchived ?? p.isArchived;
                      const isPrivate = getOverride(p.id)?.isPrivate ?? p.isPrivate;
                      return (
                        <tr key={p.id} className="hover:bg-[rgba(255,255,255,0.30)] transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-12 h-12 rounded-lg bg-[rgba(255,255,255,0.50)] overflow-hidden">
                                {p.images[0]?.url ? (
                                  <img src={p.images[0].url} alt={p.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Package className="w-5 h-5 text-text-secondary" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-text-primary">{p.name}</p>
                                <p className="text-xs text-text-secondary">{p.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline">{p.category.name}</Badge>
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-sm text-text-primary">{p.tenantName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-2">
                              {isArchived ? (
                                <Badge className="bg-[#f59e0b] text-white border-0">Archived</Badge>
                              ) : (
                                <Badge className="bg-[#10b981] text-white border-0">Active</Badge>
                              )}
                              {isPrivate && (
                                <Badge className="bg-[#9b51e0] text-white border-0">Private</Badge>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/products/${p.slug}`}>
                                <Button variant="outline" size="sm">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </Link>
                              <Button
                                variant={isArchived ? "secondary" : "outline"}
                                size="sm"
                                onClick={async () => {
                                  const next = !isArchived;
                                  setOverride(p.id, { isArchived: next });
                                  try {
                                    await patchProduct(p.slug, { isArchived: next });
                                  } catch {
                                    clearOverride(p.id);
                                  }
                                }}
                              >
                                {isArchived ? <Eye className="w-4 h-4" /> : <Archive className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant={isPrivate ? "secondary" : "outline"}
                                size="sm"
                                onClick={async () => {
                                  const next = !isPrivate;
                                  setOverride(p.id, { isPrivate: next });
                                  try {
                                    await patchProduct(p.slug, { isPrivate: next });
                                  } catch {
                                    clearOverride(p.id);
                                  }
                                }}
                              >
                                {isPrivate ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => clearOverride(p.id)}
                              >
                                <RefreshCw className="w-4 h-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

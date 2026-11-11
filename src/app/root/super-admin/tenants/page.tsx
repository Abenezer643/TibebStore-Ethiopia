"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { useAdminTenantOverrides } from "@/hooks/useAdminTenantOverrides";
import { Drawer } from "@/components/ui/Drawer";
import { useTenants } from "@/hooks/useTenants";
import type { Tenant } from "@/types";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Search, Building2, Plus, ExternalLink, Edit2, Power, RefreshCw, Trash2 } from "lucide-react";

export default function AdminTenantsPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { setOverride, getOverride, clearOverride } = useAdminTenantOverrides();
  const { tenants, createTenant, updateTenant, deleteTenant } = useTenants();

  const [query, setQuery] = useState("");
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formDescription, setFormDescription] = useState("");

  const isAdmin = user?.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const patchTenant = async (idOrSlug: string, patch: { isDisabled: boolean }) => {
    const res = await fetch(`/api/admin/tenants/${idOrSlug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(patch),
    });
    if (!res.ok) {
      const json = (await res.json().catch(() => null)) as any;
      throw new Error(json?.error ?? "Failed to update tenant");
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

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return tenants;
    return tenants.filter((t) => {
      return (
        t.name.toLowerCase().includes(normalized) ||
        t.slug.toLowerCase().includes(normalized) ||
        (t.description ?? "").toLowerCase().includes(normalized)
      );
    });
  }, [query, tenants]);

  const stats = useMemo(() => {
    const total = tenants.length;
    const disabled = tenants.filter(t => getOverride(t.id)?.isDisabled ?? false).length;
    const active = total - disabled;
    return { total, disabled, active };
  }, [tenants, getOverride]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;
  if (!isAdmin) return null;

  const openCreate = () => {
    setEditing(null);
    setFormName("");
    setFormSlug("");
    setFormDescription("");
    setIsDrawerOpen(true);
  };

  const openEdit = (t: Tenant) => {
    setEditing(t);
    setFormName(t.name ?? "");
    setFormSlug(t.slug ?? "");
    setFormDescription(t.description ?? "");
    setIsDrawerOpen(true);
  };

  const save = () => {
    if (editing) {
      updateTenant(editing.id, { name: formName, slug: formSlug, description: formDescription });
    } else {
      createTenant({ name: formName, slug: formSlug, description: formDescription, ownerId: "admin" });
    }
    setIsDrawerOpen(false);
  };

  return (
    <AdminLayout title="Tenants" subtitle="Manage stores">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="default" className="p-4 border border-[rgba(255,255,255,0.35)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(46,144,250,0.15)] flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Total Tenants</p>
                <p className="text-xl font-bold text-text-primary">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
                <Power className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Active</p>
                <p className="text-xl font-bold text-success">{stats.active}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                <Power className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Disabled</p>
                <p className="text-xl font-bold text-error">{stats.disabled}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search & Create */}
        <Card variant="elevated" className="p-4 border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input
                placeholder="Search by name, slug, description..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-11"
              />
            </div>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="w-4 h-4 mr-2" />
              New Tenant
            </Button>
          </div>
        </Card>

        {/* Tenants Table */}
        <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgba(255,255,255,0.50)] border-b border-[rgba(255,255,255,0.35)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Store</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Slug</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.35)]">
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-text-secondary">No tenants found</td>
                  </tr>
                ) : (
                  rows.map((t) => {
                    const isDisabled = getOverride(t.id)?.isDisabled ?? false;
                    return (
                      <tr key={t.id} className="hover:bg-[rgba(255,255,255,0.30)] transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-[#429DFE] flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{t.name?.charAt(0).toUpperCase() ?? "T"}</span>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-text-primary">{t.name}</p>
                              <p className="text-xs text-text-secondary line-clamp-1">{t.description}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <Badge variant="outline">{t.slug}</Badge>
                        </td>
                        <td className="px-6 py-4">
                          {isDisabled ? (
                            <Badge className="bg-[#ef4444] text-white border-0">Disabled</Badge>
                          ) : (
                            <Badge className="bg-[#10b981] text-white border-0">Active</Badge>
                          )}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <Link href={`/tenant/${t.slug}`}>
                              <Button variant="outline" size="sm">
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </Link>
                            <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={isDisabled ? "secondary" : "outline"}
                              size="sm"
                              onClick={async () => {
                                const next = !isDisabled;
                                setOverride(t.id, { isDisabled: next });
                                try {
                                  await patchTenant(t.slug, { isDisabled: next });
                                } catch {
                                  clearOverride(t.id);
                                }
                              }}
                            >
                              <Power className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearOverride(t.id)}
                            >
                              <RefreshCw className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                deleteTenant(t.id);
                                clearOverride(t.id);
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
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
        </Card>

        {/* Drawer */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title={editing ? "Edit Tenant" : "New Tenant"}
        >
          <div className="space-y-4">
            <Input label="Name" placeholder="Store name" value={formName} onChange={(e) => setFormName(e.target.value)} />
            <Input label="Slug" placeholder="e.g. harar-leather" value={formSlug} onChange={(e) => setFormSlug(e.target.value)} />
            <Input label="Description" placeholder="Short description" value={formDescription} onChange={(e) => setFormDescription(e.target.value)} />
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setIsDrawerOpen(false)}>Cancel</Button>
              <Button variant="primary" onClick={save}>{editing ? "Save Changes" : "Create"}</Button>
            </div>
          </div>
        </Drawer>
      </div>
    </AdminLayout>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Search, UserCheck, UserX, Pause, Play, MoreVertical, Mail, Calendar } from "lucide-react";

type SellerState = "approved" | "pending" | "rejected";

function StatusBadge({ status }: { status: SellerState }) {
  if (status === "approved") return <Badge className="bg-[#10b981] text-white border-0">Approved</Badge>;
  if (status === "pending") return <Badge className="bg-[#f59e0b] text-white border-0">Pending</Badge>;
  return <Badge className="bg-[#ef4444] text-white border-0">Rejected</Badge>;
}

export default function AdminSellersPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { users, patchUser } = useAdminUsers();

  const [query, setQuery] = useState("");

  const isAdmin = user?.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

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

  const sellers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const reviewed = users.filter((u) => u.sellerStatus !== "none");
    const sorted = [...reviewed].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));

    if (!normalized) return sorted;
    return sorted.filter((a) => {
      return (
        a.email.toLowerCase().includes(normalized) ||
        a.username.toLowerCase().includes(normalized)
      );
    });
  }, [users, query]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;
  if (!isAdmin) return null;

  const setStatus = async (email: string, status: SellerState) => {
    const nextRole = status === "approved" ? "seller" : "user";
    await patchUser(email, { sellerStatus: status, role: nextRole });
    toast("success", `Seller ${status}`);
  };

  return (
    <AdminLayout title="Sellers" subtitle="Manage seller accounts">
      <div className="space-y-6">
        {/* Search and Filters */}
        <Card variant="elevated" className="p-4 border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
              <Input
                placeholder="Search by email, store name, username..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="pl-11"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">All</Button>
              <Button variant="ghost" size="sm">Approved</Button>
              <Button variant="ghost" size="sm">Pending</Button>
              <Button variant="ghost" size="sm">Rejected</Button>
            </div>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <Card variant="default" className="p-4 border border-[rgba(255,255,255,0.35)]">
            <p className="text-xs font-medium text-text-secondary">Total Sellers</p>
            <p className="mt-1 text-2xl font-bold text-text-primary">{sellers.length}</p>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(16,185,129,0.2)]">
            <p className="text-xs font-medium text-text-secondary">Approved</p>
            <p className="mt-1 text-2xl font-bold text-success">{sellers.filter(s => s.sellerStatus === "approved").length}</p>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(245,158,11,0.2)]">
            <p className="text-xs font-medium text-text-secondary">Pending</p>
            <p className="mt-1 text-2xl font-bold text-warning">{sellers.filter(s => s.sellerStatus === "pending").length}</p>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(239,68,68,0.2)]">
            <p className="text-xs font-medium text-text-secondary">Suspended</p>
            <p className="mt-1 text-2xl font-bold text-error">{sellers.filter(s => s.isSuspended).length}</p>
          </Card>
        </div>

        {/* Sellers Table */}
        <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[rgba(255,255,255,0.50)] border-b border-[rgba(255,255,255,0.35)]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Seller</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-text-secondary uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-text-secondary uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[rgba(255,255,255,0.35)]">
                {sellers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-sm text-text-secondary">
                      No sellers found
                    </td>
                  </tr>
                ) : (
                  sellers.map((s) => (
                    <tr key={s.id} className="hover:bg-[rgba(255,255,255,0.30)] transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#429DFE] flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-white">{s.username.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-text-primary">{s.username}</p>
                            <p className="text-xs text-text-secondary">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                          <StatusBadge status={s.sellerStatus as SellerState} />
                          {s.isSuspended && <Badge className="bg-[#ef4444] text-white border-0">Suspended</Badge>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                          <Calendar className="w-4 h-4" />
                          {s.updatedAt ? new Date(s.updatedAt).toLocaleDateString() : "N/A"}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <Button variant="primary" size="sm" onClick={() => void setStatus(s.email, "approved")}>
                            <UserCheck className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => void setStatus(s.email, "rejected")}>
                            <UserX className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                          {s.isSuspended ? (
                            <Button variant="secondary" size="sm" onClick={() => { void patchUser(s.email, { isSuspended: false }); toast("success", "Seller unsuspended"); }}>
                              <Play className="w-4 h-4 mr-1" />
                              Unsuspend
                            </Button>
                          ) : (
                            <Button variant="outline" size="sm" onClick={() => { void patchUser(s.email, { isSuspended: true }); toast("success", "Seller suspended"); }}>
                              <Pause className="w-4 h-4 mr-1" />
                              Suspend
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </AdminLayout>
  );
}

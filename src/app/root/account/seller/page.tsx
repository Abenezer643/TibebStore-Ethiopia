"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { Package, ShoppingBag, DollarSign, Clock, TrendingUp, Store, ImagePlus, ExternalLink, ChevronRight, ShieldCheck } from "lucide-react";

interface SellerStats {
  totalEarnings: number;
  totalPayouts: number;
  pendingPayouts: number;
  availableBalance: number;
  escrowHeld: number;
  releasedOrderCount: number;
  heldOrderCount: number;
}

interface SellerOrder {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: Array<{ name: string; price: number; quantity: number }>;
  buyerName?: string;
  releaseStatus?: string;
  sellerEarnings?: number;
  commissionRate?: number;
}

export default function SellerDashboardPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated, refresh } = useAuth();
  const { toast } = useToast();

  const [tenant, setTenant] = useState<any | null>(null);
  const [isLoadingTenant, setIsLoadingTenant] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoName, setLogoName] = useState<string | null>(null);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(true);
  const [stats, setStats] = useState<SellerStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<SellerOrder[]>([]);
  const [productCount, setProductCount] = useState(0);

  useEffect(() => {
    console.log('[SellerDashboard] State:', { isHydrated, isAuthenticated, userRole: user?.role, sellerStatus: user?.sellerStatus });
  }, [isHydrated, isAuthenticated, user]);

  const logoPreviewUrl = useMemo(() => {
    if (!logoFile) return null;
    return URL.createObjectURL(logoFile);
  }, [logoFile]);

  const canRemoveLogo = !!tenant?.logo?.url || !!logoPreviewUrl;

  const loadTenant = async () => {
    setIsLoadingTenant(true);
    try {
      const res = await fetch("/api/seller/tenant");
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to load store");
      setTenant(json?.tenant ?? null);
    } catch (e) {
      setTenant(null);
    } finally {
      setIsLoadingTenant(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("/api/seller/payouts?stats=true");
      const json = await res.json();
      if (res.ok) setStats(json.stats || null);
    } catch {}
  };

  const loadOrders = async () => {
    try {
      const res = await fetch("/api/seller/orders");
      const json = await res.json();
      if (res.ok) setRecentOrders((json.orders || []).slice(0, 5));
    } catch {}
  };

  const loadProductCount = async () => {
    try {
      const res = await fetch("/api/seller/products");
      const json = await res.json();
      if (res.ok) setProductCount((json.products || []).length);
    } catch {}
  };

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }

    const checkSellerStatus = async () => {
      setIsCheckingStatus(true);
      try {
        await refresh();
      } catch (e) {
        console.error('[SellerDashboard] Failed to refresh user:', e);
      } finally {
        setIsCheckingStatus(false);
      }
    };

    checkSellerStatus();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, isAuthenticated]);

  useEffect(() => {
    if (isCheckingStatus) return;
    if (!user) return;

    if (user.sellerStatus !== "approved") {
      router.replace("/account/become-seller");
      return;
    }

    if (user.isSuspended) {
      router.replace("/account");
      return;
    }

    loadTenant();
    loadStats();
    loadOrders();
    loadProductCount();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCheckingStatus]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  const status = user.sellerStatus;
  const isSuspended = !!user.isSuspended;

  if (isSuspended) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-black uppercase tracking-tight">Seller Dashboard</h2>
        <p className="mt-2 text-sm font-bold text-text-secondary uppercase">
          Your seller account is suspended.
        </p>
        <div className="mt-4">
          <Link href="/account">
            <Button variant="secondary">Back to Account</Button>
          </Link>
        </div>
      </Card>
    );
  }

  if (status !== "approved") {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-black uppercase tracking-tight">Seller Dashboard</h2>
        <p className="mt-2 text-sm font-bold text-text-secondary uppercase">
          You don't have access yet.
        </p>
        <div className="mt-4 flex items-center gap-3">
          <Badge variant={status === "pending" ? "outline" : "warning"}>
            {status === "none" ? "not a seller" : status}
          </Badge>
          <Link href="/account/become-seller">
            <Button variant="secondary">Go to Become a Seller</Button>
          </Link>
        </div>
      </Card>
    );
  }

  const totalOrders = recentOrders.length;
  const activeOrders = recentOrders.filter(o => o.status === "pending" || o.status === "confirmed" || o.status === "processing" || o.status === "shipped").length;

  return (
    <div className="space-y-6">
      {/* Store Header */}
      <Card className="p-6 border border-[rgba(139,92,246,0.2)] bg-gradient-to-br from-[rgba(139,92,246,0.06)] to-[rgba(255,255,255,0.70)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-[rgba(139,92,246,0.3)] shadow-lg flex items-center justify-center">
              {tenant?.logo?.url ? (
                <img src={tenant.logo.url} alt={tenant.name} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[rgba(139,92,246,0.15)] flex items-center justify-center">
                  <span className="text-2xl font-black text-[#8b5cf6]">{tenant?.name?.[0]?.toUpperCase() ?? "S"}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => document.querySelector<HTMLInputElement>('#seller-logo-input')?.click()}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#8b5cf6] text-white flex items-center justify-center shadow-md hover:bg-[#7c3aed] transition-colors"
              title="Change store logo"
            >
              <ImagePlus className="w-3 h-3" />
            </button>
            <input
              id="seller-logo-input"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setLogoFile(f);
                setLogoName(f?.name ?? null);
              }}
            />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black uppercase tracking-tight">{tenant?.name ?? "Your Store"}</h2>
            <p className="text-sm text-text-secondary mt-0.5">
              {tenant?.slug ? `tibeb-store.vercel.app/tenant/${tenant.slug}` : "Loading..."}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {tenant?.slug && (
              <Link href={`/tenant/${tenant.slug}`} target="_blank">
                <Button variant="accent" size="sm"><ExternalLink className="w-4 h-4 mr-1" />Storefront</Button>
              </Link>
            )}
            <Link href="/account/seller/products/new">
              <Button variant="secondary" size="sm"><ShoppingBag className="w-4 h-4 mr-1" />Add Product</Button>
            </Link>
          </div>
        </div>

        {/* Logo upload bar (shown when file selected) */}
        {logoFile && (
          <div className="mt-4 flex items-center gap-3 p-3 rounded-xl bg-[rgba(139,92,246,0.08)] border border-[rgba(139,92,246,0.15)]">
            <div className="h-10 w-10 rounded-lg overflow-hidden shrink-0">
              {logoPreviewUrl && <img src={logoPreviewUrl} alt="Preview" className="h-full w-full object-cover" />}
            </div>
            <p className="text-xs font-bold text-text-secondary flex-1 truncate">{logoName}</p>
            <Button variant="secondary" size="sm" disabled={isSavingLogo} isLoading={isSavingLogo}
              onClick={async () => {
                if (!logoFile) return;
                setIsSavingLogo(true);
                try {
                  const form = new FormData();
                  form.set("logo", logoFile);
                  const res = await fetch("/api/seller/tenant/logo", { method: "POST", body: form });
                  const json = (await res.json().catch(() => null)) as any;
                  if (!res.ok) throw new Error(json?.error ?? "Failed to upload");
                  toast("success", "Store picture updated");
                  setLogoFile(null);
                  setLogoName(null);
                  await loadTenant();
                } catch (e) {
                  toast("error", e instanceof Error ? e.message : "Failed to upload");
                } finally {
                  setIsSavingLogo(false);
                }
              }}
            >Save</Button>
            <Button variant="outline" size="sm" disabled={isSavingLogo}
              onClick={() => { setLogoFile(null); setLogoName(null); }}
            >Cancel</Button>
          </div>
        )}
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-[rgba(139,92,246,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.12)] flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Earnings</p>
              <p className="text-lg font-black">{stats ? formatCurrency(stats.totalEarnings) : "—"}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-[rgba(66,157,254,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(66,157,254,0.12)] flex items-center justify-center">
              <Package className="w-5 h-5 text-[#429DFE]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Active Orders</p>
              <p className="text-lg font-black">{activeOrders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-[rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(16,185,129,0.12)] flex items-center justify-center">
              <ShoppingBag className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Products</p>
              <p className="text-lg font-black">{productCount}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-[rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(245,158,11,0.12)] flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">In Escrow</p>
              <p className="text-lg font-black">{stats ? formatCurrency(stats.escrowHeld || 0) : "—"}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-4">
        <Link href="/account/seller/products" className="block">
          <Card className="p-5 text-center hover:shadow-md hover:border-[rgba(16,185,129,0.3)] transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(16,185,129,0.12)] flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-[#10b981]" />
            </div>
            <p className="text-xs font-black uppercase tracking-tight">Products</p>
            <p className="text-xs text-text-secondary">{productCount} listed</p>
          </Card>
        </Link>
        <Link href="/account/seller/orders" className="block">
          <Card className="p-5 text-center hover:shadow-md hover:border-[rgba(66,157,254,0.3)] transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(66,157,254,0.12)] flex items-center justify-center">
              <Package className="w-6 h-6 text-[#429DFE]" />
            </div>
            <p className="text-xs font-black uppercase tracking-tight">Orders</p>
            <p className="text-xs text-text-secondary">{activeOrders} active</p>
          </Card>
        </Link>
        <Link href="/account/seller/payouts" className="block">
          <Card className="p-5 text-center hover:shadow-md hover:border-[rgba(139,92,246,0.3)] transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(139,92,246,0.12)] flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-[#8b5cf6]" />
            </div>
            <p className="text-xs font-black uppercase tracking-tight">Payouts</p>
            <p className="text-xs text-text-secondary">{stats ? formatCurrency(stats.availableBalance) : "—"} available</p>
          </Card>
        </Link>
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-tight">Recent Orders</h3>
          <Link href="/account/seller/orders" className="text-xs font-bold text-[#8b5cf6] hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {recentOrders.length === 0 ? (
          <div className="py-8 text-center">
            <Package className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-text-secondary">No orders yet</p>
            <p className="text-xs text-text-secondary mt-1">Orders will appear here when customers purchase your products</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o) => {
              const orderNumber = `ORD-${new Date(o.createdAt).getFullYear()}-${o.id.slice(-6).toUpperCase()}`;
              const itemCount = (o.items ?? []).reduce((sum, it) => sum + (it?.quantity ?? 0), 0);
              const statusColors: Record<string, string> = {
                pending: "bg-[rgba(245,158,11,0.12)] text-[#f59e0b]",
                confirmed: "bg-[rgba(139,92,246,0.12)] text-[#8b5cf6]",
                processing: "bg-[rgba(66,157,254,0.12)] text-[#429DFE]",
                shipped: "bg-[rgba(66,157,254,0.12)] text-[#429DFE]",
                delivered: "bg-[rgba(16,185,129,0.12)] text-[#10b981]",
                cancelled: "bg-[rgba(15,23,42,0.06)] text-text-secondary",
              };
              return (
                <div key={o.id} className="flex items-center gap-4 p-3 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.06)]">
                  <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.08)] flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5 text-[#8b5cf6]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{orderNumber}</p>
                    <p className="text-xs text-text-secondary">{itemCount} item{itemCount !== 1 ? "s" : ""} • {o.buyerName || "Customer"}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black">{formatCurrency(o.sellerEarnings || o.total)}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-full ${statusColors[o.status] || statusColors.pending}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Store Settings */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(15,23,42,0.06)] flex items-center justify-center">
              <Store className="w-5 h-5 text-text-secondary" />
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Store Settings</p>
              <p className="text-xs text-text-secondary mt-0.5">Update logo, description, and more</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tenant?.logo?.url && (
              <Button variant="outline" size="sm" disabled={isSavingLogo}
                onClick={async () => {
                  setIsSavingLogo(true);
                  try {
                    const res = await fetch("/api/seller/tenant/logo", { method: "DELETE" });
                    const json = (await res.json().catch(() => null)) as any;
                    if (!res.ok) throw new Error(json?.error ?? "Failed to remove");
                    toast("success", "Store picture removed");
                    await loadTenant();
                  } catch (e) {
                    toast("error", e instanceof Error ? e.message : "Failed to remove");
                  } finally {
                    setIsSavingLogo(false);
                  }
                }}
              >Remove Logo</Button>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

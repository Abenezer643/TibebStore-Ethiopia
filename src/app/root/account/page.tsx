"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useOrders, OrderStatus } from "@/hooks/useOrders";
import { useSellerApplications } from "@/hooks/useSellerApplications";
import { readUserSellerStatus } from "@/hooks/useSellerApplications";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { Package, Heart, MapPin, Store, Settings, CreditCard, ShoppingBag, TrendingUp, Clock, ChevronRight } from "lucide-react";

function StatusBadge({ status }: { status: OrderStatus }) {
  const variants: Record<string, "success" | "warning" | "outline" | "secondary" | "info"> = {
    processing: "warning",
    shipped: "info",
    delivered: "success",
    cancelled: "outline",
  };
  return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
}

export default function AccountPage() {
  const { user, isHydrated, isAuthenticated, refresh } = useAuth();
  const { myApplication } = useSellerApplications();
  const { orders, totals, isLoading: ordersLoading } = useOrders(user?.id);
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [wishlistCount, setWishlistCount] = useState(0);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("tibeb-favorites");
      if (stored) {
        const parsed = JSON.parse(stored);
        setWishlistCount(Array.isArray(parsed) ? parsed.length : 0);
      }
    } catch {}
  }, []);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;

  const persisted = readUserSellerStatus(user.id);
  const sellerStatus = myApplication?.status ?? persisted ?? user.sellerStatus;

  const handleAvatarUpload = async (image: { id: string; url: string }) => {
    setIsUpdating(true);
    try {
      const res = await fetch("/api/user/avatar", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ avatar: { id: image.id, url: image.url } }),
      });
      const json = await res.json();
      if (res.ok) {
        await refresh();
        toast("success", "Avatar updated");
      } else {
        toast("error", json.error || "Failed to update avatar");
      }
    } catch (error) {
      toast("error", "Failed to update avatar");
    } finally {
      setIsUpdating(false);
    }
  };

  const recentOrders = orders.slice(0, 5);
  const firstName = user.username?.split(" ")[0] || "there";

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <Card className="p-6 border border-[rgba(66,157,254,0.2)] bg-gradient-to-br from-[rgba(66,157,254,0.06)] to-[rgba(255,255,255,0.70)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl overflow-hidden border-2 border-[rgba(66,157,254,0.3)] shadow-lg">
              {user.avatar?.url ? (
                <img src={user.avatar.url} alt={user.username} className="h-full w-full object-cover" />
              ) : (
                <div className="h-full w-full bg-[rgba(66,157,254,0.15)] flex items-center justify-center">
                  <span className="text-2xl font-black text-[#429DFE]">{firstName[0]?.toUpperCase()}</span>
                </div>
              )}
            </div>
            <button
              onClick={() => document.querySelector<HTMLInputElement>('input[type="file"]')?.click()}
              className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-[#429DFE] text-white flex items-center justify-center shadow-md hover:bg-[#3182e0] transition-colors"
              title="Change avatar"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
            </button>
            <div className="hidden">
              <ImageUpload
                type="avatar"
                currentImage={user.avatar?.url ? { url: user.avatar.url, alt: "Avatar" } : null}
                onUpload={handleAvatarUpload}
              />
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-black uppercase tracking-tight">Welcome back, {firstName}</h2>
            <p className="text-sm text-text-secondary mt-0.5">{user.email}</p>
          </div>
          <div className="flex items-center gap-2">
            {sellerStatus === "approved" && (
              <Link href="/account/seller">
                <Button variant="accent" size="sm">Seller Dashboard</Button>
              </Link>
            )}
            <Link href="/account/settings">
              <Button variant="outline" size="sm"><Settings className="w-4 h-4 mr-1" />Settings</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="p-4 border border-[rgba(66,157,254,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(66,157,254,0.12)] flex items-center justify-center">
              <Package className="w-5 h-5 text-[#429DFE]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Total Orders</p>
              <p className="text-lg font-black">{ordersLoading ? "—" : totals.count}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-[rgba(245,158,11,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(245,158,11,0.12)] flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Active</p>
              <p className="text-lg font-black">{ordersLoading ? "—" : totals.openOrders}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-[rgba(16,185,129,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(16,185,129,0.12)] flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-[#10b981]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Total Spent</p>
              <p className="text-lg font-black">{ordersLoading ? "—" : formatCurrency(totals.totalSpent)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4 border border-[rgba(239,68,68,0.15)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(239,68,68,0.12)] flex items-center justify-center">
              <Heart className="w-5 h-5 text-[#ef4444]" />
            </div>
            <div>
              <p className="text-xs text-text-secondary font-semibold uppercase">Wishlist</p>
              <p className="text-lg font-black">{wishlistCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Orders */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-tight">Recent Orders</h3>
          <Link href="/account/orders" className="text-xs font-bold text-[#429DFE] hover:underline flex items-center gap-1">
            View All <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
        {ordersLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 rounded-xl bg-[rgba(255,255,255,0.60)] animate-pulse" />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="py-8 text-center">
            <ShoppingBag className="w-12 h-12 text-text-secondary/30 mx-auto mb-3" />
            <p className="text-sm font-bold text-text-secondary">No orders yet</p>
            <Link href="/products">
              <Button variant="secondary" size="sm" className="mt-3">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o) => {
              const orderNumber = `ORD-${new Date(o.createdAt).getFullYear()}-${o.id.slice(-6).toUpperCase()}`;
              const itemCount = o.items.reduce((sum, it) => sum + it.quantity, 0);
              return (
                <Link key={o.id} href={`/account/orders/${o.id}`} className="block">
                  <div className="flex items-center gap-4 p-3 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.06)] hover:border-[rgba(66,157,254,0.3)] hover:shadow-sm transition-all">
                    <div className="w-10 h-10 rounded-xl bg-[rgba(66,157,254,0.08)] flex items-center justify-center shrink-0">
                      <Package className="w-5 h-5 text-[#429DFE]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{orderNumber}</p>
                      <p className="text-xs text-text-secondary">{itemCount} item{itemCount !== 1 ? "s" : ""} • {new Date(o.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black">{formatCurrency(o.total)}</p>
                      <StatusBadge status={o.status} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </Card>

      {/* Quick Links Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link href="/account/orders" className="block">
          <Card className="p-5 text-center hover:shadow-md hover:border-[rgba(66,157,254,0.3)] transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(66,157,254,0.12)] flex items-center justify-center">
              <Package className="w-6 h-6 text-[#429DFE]" />
            </div>
            <p className="text-xs font-black uppercase tracking-tight">My Orders</p>
          </Card>
        </Link>
        <Link href="/account/favorites" className="block">
          <Card className="p-5 text-center hover:shadow-md hover:border-[rgba(239,68,68,0.3)] transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(239,68,68,0.12)] flex items-center justify-center">
              <Heart className="w-6 h-6 text-[#ef4444]" />
            </div>
            <p className="text-xs font-black uppercase tracking-tight">Favorites</p>
          </Card>
        </Link>
        <Link href="/account/addresses" className="block">
          <Card className="p-5 text-center hover:shadow-md hover:border-[rgba(16,185,129,0.3)] transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(16,185,129,0.12)] flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#10b981]" />
            </div>
            <p className="text-xs font-black uppercase tracking-tight">Addresses</p>
          </Card>
        </Link>
        <Link href="/account/payments" className="block">
          <Card className="p-5 text-center hover:shadow-md hover:border-[rgba(245,158,11,0.3)] transition-all cursor-pointer h-full flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(245,158,11,0.12)] flex items-center justify-center">
              <CreditCard className="w-6 h-6 text-[#f59e0b]" />
            </div>
            <p className="text-xs font-black uppercase tracking-tight">Payments</p>
          </Card>
        </Link>
      </div>

      {/* Seller Section */}
      {sellerStatus !== "none" && (
        <Card className="p-6 border border-[rgba(139,92,246,0.2)] bg-gradient-to-br from-[rgba(139,92,246,0.04)] to-[rgba(255,255,255,0.70)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.12)] flex items-center justify-center">
                <Store className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Seller Account</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge variant={sellerStatus === "approved" ? "success" : sellerStatus === "pending" ? "warning" : "outline"}>
                    {sellerStatus}
                  </Badge>
                </div>
              </div>
            </div>
            <Link href={sellerStatus === "approved" ? "/account/seller" : "/account/become-seller"}>
              <Button variant={sellerStatus === "approved" ? "accent" : "secondary"} size="sm">
                {sellerStatus === "approved" ? "Dashboard" : sellerStatus === "pending" ? "View Application" : "Re-Apply"}
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {sellerStatus === "none" && (
        <Card className="p-6 border border-dashed border-[rgba(139,92,246,0.3)]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.08)] flex items-center justify-center">
                <Store className="w-5 h-5 text-[#8b5cf6]" />
              </div>
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Become a Seller</p>
                <p className="text-xs text-text-secondary mt-0.5">Start selling your crafts on TibebStore</p>
              </div>
            </div>
            <Link href="/account/become-seller">
              <Button variant="secondary" size="sm">Get Started</Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  );
}

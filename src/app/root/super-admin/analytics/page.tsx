"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { TrendingUp, TrendingDown, DollarSign, Users, Package, Building2, ShoppingBag, Activity } from "lucide-react";

type AnalyticsStats = {
  users: {
    total: number;
    buyers: number;
    sellers: number;
    approvedSellers: number;
    pendingSellers: number;
    suspended: number;
  };
  orders: {
    total: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    pending: number;
  };
  revenue: number;
  products: number;
  tenants: {
    total: number;
    active: number;
  };
  messages: {
    unread: number;
  };
  newsletter: {
    subscribers: number;
  };
};

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color: "blue" | "green" | "purple" | "orange" | "red" | "cyan";
  subtitle?: string;
}

function MetricCard({ title, value, icon, trend, color, subtitle }: MetricCardProps) {
  const colorClasses = {
    blue: "bg-[#429DFE]",
    green: "bg-[#10b981]",
    purple: "bg-[#9b51e0]",
    orange: "bg-[#f59e0b]",
    red: "bg-[#ef4444]",
    cyan: "bg-[#06b6d4]",
  };

  return (
    <Card variant="elevated" className="p-6 border border-[rgba(255,255,255,0.35)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-text-secondary">{subtitle}</p>}
          {trend && (
            <div className="mt-2 flex items-center gap-1">
              {trend.value >= 0 ? (
                <TrendingUp className="w-4 h-4 text-success" />
              ) : (
                <TrendingDown className="w-4 h-4 text-error" />
              )}
              <span className={trend.value >= 0 ? "text-sm text-success" : "text-sm text-error"}>
                {trend.value >= 0 ? "+" : ""}{trend.value}%
              </span>
              <span className="text-xs text-text-secondary">{trend.label}</span>
            </div>
          )}
        </div>
        <div className={`w-12 h-12 rounded-xl ${colorClasses[color]} flex items-center justify-center shadow-md`}>
          {icon}
        </div>
      </div>
    </Card>
  );
}

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!isHydrated || !isAdmin) return;

    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/stats");
        const json = await res.json().catch(() => null);
        if (res.ok && json) {
          setStats(json);
        }
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, [isHydrated, isAdmin]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;
  if (!isAdmin) return null;

  if (isLoading || !stats) {
    return (
      <AdminLayout title="Analytics" subtitle="Platform metrics and insights">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-secondary">Loading analytics...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Analytics" subtitle="Platform metrics and insights">
      <div className="space-y-8">
        {/* Revenue Overview */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Revenue"
            value={`ETB ${stats.revenue.toLocaleString()}`}
            icon={<DollarSign className="w-6 h-6 text-white" />}
            color="green"
          />
          <MetricCard
            title="Total Orders"
            value={stats.orders.total}
            icon={<ShoppingBag className="w-6 h-6 text-white" />}
            color="blue"
          />
          <MetricCard
            title="Active Tenants"
            value={stats.tenants.active}
            icon={<Building2 className="w-6 h-6 text-white" />}
            color="purple"
            subtitle={`${stats.tenants.total - stats.tenants.active} disabled`}
          />
          <MetricCard
            title="Total Products"
            value={stats.products}
            icon={<Package className="w-6 h-6 text-white" />}
            color="orange"
          />
        </div>

        {/* User Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Total Users"
            value={stats.users.total}
            icon={<Users className="w-6 h-6 text-white" />}
            color="blue"
          />
          <MetricCard
            title="Buyers"
            value={stats.users.buyers}
            icon={<Users className="w-6 h-6 text-white" />}
            color="cyan"
          />
          <MetricCard
            title="Sellers"
            value={stats.users.sellers}
            icon={<Users className="w-6 h-6 text-white" />}
            color="purple"
          />
          <MetricCard
            title="Suspended"
            value={stats.users.suspended}
            icon={<Users className="w-6 h-6 text-white" />}
            color="red"
          />
        </div>

        {/* Seller Applications */}
        <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
          <div className="p-6 border-b border-[rgba(255,255,255,0.35)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(46,144,250,0.15)] flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Seller Applications</h3>
                  <p className="text-sm text-text-secondary">Application status breakdown</p>
                </div>
              </div>
              <Badge className="bg-[#429DFE] text-white border-0 text-sm">
                {stats.users.sellers} Total
              </Badge>
            </div>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Approved</span>
                  <Badge className="bg-[#10b981] text-white border-0">{stats.users.approvedSellers}</Badge>
                </div>
                <div className="mt-4 h-2 rounded-full bg-[rgba(16,185,129,0.2)]">
                  <div 
                    className="h-full rounded-full bg-[#10b981]" 
                    style={{ width: `${stats.users.sellers ? (stats.users.approvedSellers / stats.users.sellers) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[rgba(245,158,11,0.1)] border border-[rgba(245,158,11,0.2)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Pending</span>
                  <Badge className="bg-[#f59e0b] text-white border-0">{stats.users.pendingSellers}</Badge>
                </div>
                <div className="mt-4 h-2 rounded-full bg-[rgba(245,158,11,0.2)]">
                  <div 
                    className="h-full rounded-full bg-[#f59e0b]" 
                    style={{ width: `${stats.users.sellers ? (stats.users.pendingSellers / stats.users.sellers) * 100 : 0}%` }}
                  />
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)]">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-text-secondary">Suspended</span>
                  <Badge className="bg-[#ef4444] text-white border-0">{stats.users.suspended}</Badge>
                </div>
                <div className="mt-4 h-2 rounded-full bg-[rgba(239,68,68,0.2)]">
                  <div 
                    className="h-full rounded-full bg-[#ef4444]" 
                    style={{ width: `${stats.users.total ? (stats.users.suspended / stats.users.total) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Order Status & Messages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Order Status */}
          <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            <div className="p-6 border-b border-[rgba(255,255,255,0.35)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(155,81,224,0.15)] flex items-center justify-center">
                  <Activity className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Order Status</h3>
                  <p className="text-sm text-text-secondary">Current order distribution</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.30)]">
                <span className="text-sm text-text-primary">Processing</span>
                <Badge className="bg-[#429DFE] text-white border-0">{stats.orders.processing}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.30)]">
                <span className="text-sm text-text-primary">Shipped</span>
                <Badge className="bg-[#06b6d4] text-white border-0">{stats.orders.shipped}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.30)]">
                <span className="text-sm text-text-primary">Delivered</span>
                <Badge className="bg-[#10b981] text-white border-0">{stats.orders.delivered}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.30)]">
                <span className="text-sm text-text-primary">Cancelled</span>
                <Badge className="bg-[#ef4444] text-white border-0">{stats.orders.cancelled}</Badge>
              </div>
            </div>
          </Card>

          {/* Newsletter & Messages */}
          <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            <div className="p-6 border-b border-[rgba(255,255,255,0.35)]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                  <Package className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-text-primary">Communications</h3>
                  <p className="text-sm text-text-secondary">Messages and subscribers</p>
                </div>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.30)]">
                <span className="text-sm text-text-primary">Unread Messages</span>
                <Badge className="bg-[#f59e0b] text-white border-0">{stats.messages.unread}</Badge>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(255,255,255,0.30)]">
                <span className="text-sm text-text-primary">Newsletter Subscribers</span>
                <Badge className="bg-[#9b51e0] text-white border-0">{stats.newsletter.subscribers}</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

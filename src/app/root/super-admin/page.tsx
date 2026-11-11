"use client";

/* Escrow Admin Dashboard */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth, SUPER_ADMIN_EMAIL } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { 
  Users, 
  Package, 
  ShoppingBag, 
  Building2, 
  BarChart3, 
  Settings,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Mail,
} from "lucide-react";

type AdminStats = {
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
  grossSales: number;
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

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: { value: number; label: string };
  color: "blue" | "green" | "purple" | "orange" | "red";
}

function StatCard({ title, value, icon, trend, color }: StatCardProps) {
  const colorClasses = {
    blue: "bg-[#429DFE]",
    green: "bg-[#10b981]",
    purple: "bg-[#9b51e0]",
    orange: "bg-[#f59e0b]",
    red: "bg-[#ef4444]",
  };

  return (
    <Card variant="elevated" className="p-6 border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-text-secondary">{title}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
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

export default function SuperAdminHomePage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
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
        console.error("Failed to fetch admin stats:", error);
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
      <AdminLayout title="Dashboard" subtitle="Platform overview">
        <div className="flex items-center justify-center py-12">
          <p className="text-sm text-text-secondary">Loading...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard" subtitle="Platform overview">
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Users"
            value={stats.users.total}
            icon={<Users className="w-6 h-6 text-white" />}
            color="blue"
          />
          <StatCard
            title="Platform Commission"
            value={`ETB ${stats.revenue.toLocaleString()}`}
            icon={<TrendingUp className="w-6 h-6 text-white" />}
            color="green"
          />
          <StatCard
            title="Gross Sales"
            value={`ETB ${(stats.grossSales || 0).toLocaleString()}`}
            icon={<BarChart3 className="w-6 h-6 text-white" />}
            color="blue"
          />
          <StatCard
            title="Total Orders"
            value={stats.orders.total}
            icon={<ShoppingBag className="w-6 h-6 text-white" />}
            color="purple"
          />
          <StatCard
            title="Products"
            value={stats.products}
            icon={<Package className="w-6 h-6 text-white" />}
            color="orange"
          />
        </div>

        {/* Second Row Stats */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Active Tenants"
            value={stats.tenants.active}
            icon={<Building2 className="w-6 h-6 text-white" />}
            color="blue"
          />
          <StatCard
            title="Approved Sellers"
            value={stats.users.approvedSellers}
            icon={<CheckCircle className="w-6 h-6 text-white" />}
            color="green"
          />
          <StatCard
            title="Unread Messages"
            value={stats.messages.unread}
            icon={<Mail className="w-6 h-6 text-white" />}
            color="orange"
          />
          <StatCard
            title="Subscribers"
            value={stats.newsletter.subscribers}
            icon={<Users className="w-6 h-6 text-white" />}
            color="purple"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Seller Applications */}
          <Card variant="elevated" className="p-6 border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Seller Applications</h3>
              <Badge className="bg-[#f59e0b] text-white border-0">
                {stats.users.pendingSellers} pending
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(16,185,129,0.1)]">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm text-text-primary">Approved</span>
                </div>
                <span className="text-sm font-bold text-success">{stats.users.approvedSellers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(245,158,11,0.1)]">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-warning" />
                  <span className="text-sm text-text-primary">Pending</span>
                </div>
                <span className="text-sm font-bold text-warning">{stats.users.pendingSellers}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(239,68,68,0.1)]">
                <div className="flex items-center gap-3">
                  <XCircle className="w-5 h-5 text-error" />
                  <span className="text-sm text-text-primary">Suspended</span>
                </div>
                <span className="text-sm font-bold text-error">{stats.users.suspended}</span>
              </div>
            </div>
            <Link href="/super-admin/seller-applications" className="mt-4 block">
              <Button variant="outline" className="w-full bg-[rgba(66,157,254,0.08)] border-[rgba(66,157,254,0.3)] text-primary hover:bg-[rgba(66,157,254,0.15)] hover:border-[rgba(66,157,254,0.5)]">
                Review Applications
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>

          {/* Order Status */}
          <Card variant="elevated" className="p-6 border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-text-primary">Order Status</h3>
              <Badge className="bg-[#429DFE] text-white border-0">
                {stats.orders.pending} active
              </Badge>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(46,144,250,0.1)]">
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  <span className="text-sm text-text-primary">Processing</span>
                </div>
                <span className="text-sm font-bold text-primary">{stats.orders.processing}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(66,157,254,0.1)]">
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <span className="text-sm text-text-primary">Shipped</span>
                </div>
                <span className="text-sm font-bold text-primary">{stats.orders.shipped}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-[rgba(16,185,129,0.1)]">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-success" />
                  <span className="text-sm text-text-primary">Delivered</span>
                </div>
                <span className="text-sm font-bold text-success">{stats.orders.delivered}</span>
              </div>
            </div>
            <Link href="/super-admin/orders" className="mt-4 block">
              <Button variant="outline" className="w-full bg-[rgba(66,157,254,0.08)] border-[rgba(66,157,254,0.3)] text-primary hover:bg-[rgba(66,157,254,0.15)] hover:border-[rgba(66,157,254,0.5)]">
                Manage Orders
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </Card>

          {/* Quick Links */}
          <Card variant="elevated" className="p-6 border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
            <h3 className="text-lg font-bold text-text-primary mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Link href="/super-admin/sellers" className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.50)] hover:bg-[rgba(255,255,255,0.80)] transition-colors">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-text-primary">Manage Sellers</span>
                <ArrowRight className="w-4 h-4 ml-auto text-text-secondary" />
              </Link>
              <Link href="/super-admin/products" className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.50)] hover:bg-[rgba(255,255,255,0.80)] transition-colors">
                <Package className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-text-primary">View Products</span>
                <ArrowRight className="w-4 h-4 ml-auto text-text-secondary" />
              </Link>
              <Link href="/super-admin/tenants" className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.50)] hover:bg-[rgba(255,255,255,0.80)] transition-colors">
                <Building2 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-text-primary">Manage Tenants</span>
                <ArrowRight className="w-4 h-4 ml-auto text-text-secondary" />
              </Link>
              <Link href="/super-admin/analytics" className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.50)] hover:bg-[rgba(255,255,255,0.80)] transition-colors">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-text-primary">View Analytics</span>
                <ArrowRight className="w-4 h-4 ml-auto text-text-secondary" />
              </Link>
              <Link href="/super-admin/commissions" className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.50)] hover:bg-[rgba(255,255,255,0.80)] transition-colors">
                <TrendingUp className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-text-primary">Commissions & Escrow</span>
                <ArrowRight className="w-4 h-4 ml-auto text-text-secondary" />
              </Link>
            </div>
          </Card>
        </div>

        {/* Alerts */}
        {stats.users.suspended > 0 && (
          <Card variant="elevated" className="p-4 border-2 border-error/30 bg-[rgba(239,68,68,0.05)] shadow-[0_4px_24px_rgba(239,68,68,0.15)]">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-error" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-text-primary">
                  {stats.users.suspended} user{stats.users.suspended > 1 ? "s" : ""} currently suspended
                </p>
                <p className="text-xs text-text-secondary">Review suspended accounts in the sellers panel</p>
              </div>
              <Link href="/super-admin/sellers">
                <Button variant="outline" size="sm">View</Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}

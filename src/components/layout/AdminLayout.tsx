"use client";

import { ReactNode, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, SUPER_ADMIN_EMAIL } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  Building2,
  BarChart3,
  Settings,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Bell,
  ChevronDown,
  Sparkles,
  ArrowLeft,
  Mail,
  Flag,
} from "lucide-react";

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
  subtitle?: string;
}

const navItems = [
  { href: "/super-admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/super-admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/super-admin/products", label: "Products", icon: Package },
  { href: "/super-admin/sellers", label: "Sellers", icon: Users },
  { href: "/super-admin/seller-applications", label: "Applications", icon: Users },
  { href: "/super-admin/reports", label: "Reports", icon: Flag },
  { href: "/super-admin/messages", label: "Messages", icon: Mail },
  { href: "/super-admin/subscribers", label: "Newsletter", icon: Mail },
  { href: "/super-admin/tenants", label: "Tenants", icon: Building2 },
  { href: "/super-admin/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/super-admin/settings", label: "Settings", icon: Settings },
];

export function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isAdmin = user?.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const handleSignOut = () => {
    signOut();
    router.push("/");
  };

  return (
    <div className="flex min-h-screen bg-[#F0F3FF]">
      {/* Sidebar - fixed on mobile, sticky on desktop */}
      <aside
        className={cn(
          "fixed lg:sticky top-0 h-screen w-64 shrink-0 bg-[rgba(255,255,255,0.90)] backdrop-blur-xl border-r border-[rgba(255,255,255,0.35)] shadow-[0_8px_32px_rgba(0,0,0,0.12)] transform transition-transform duration-300 z-50 lg:z-auto lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-[rgba(255,255,255,0.35)]">
            <Link href="/super-admin" className="flex items-center gap-3">
              <img src="/Headerlogo.png" alt="TibebStore" className="h-12 w-auto" />
              <div>
                <span className="text-lg font-bold text-text-primary">Admin</span>
                <span className="text-xs text-text-secondary block">TibebStore</span>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                    isActive
                      ? "bg-[#429DFE] text-white shadow-[0_4px_16px_rgba(66,157,254,0.4)]"
                      : "text-text-secondary hover:bg-[rgba(66,157,254,0.08)] hover:text-text-primary border border-transparent hover:border-[rgba(66,157,254,0.2)]"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-[rgba(255,255,255,0.35)]">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.60)] shadow-sm">
              <div className="w-10 h-10 rounded-full bg-[#429DFE] flex items-center justify-center shadow-sm">
                <span className="text-sm font-bold text-white">
                  {user?.username?.charAt(0).toUpperCase() || "A"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-text-primary truncate">{user?.username}</p>
                <p className="text-xs text-text-secondary truncate">Super Admin</p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.60)] text-text-secondary hover:text-error transition-colors"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-30 bg-[rgba(255,255,255,0.90)] backdrop-blur-xl border-b border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 rounded-lg hover:bg-[rgba(255,255,255,0.60)] lg:hidden"
              >
                <Menu className="w-5 h-5 text-text-primary" />
              </button>
              <div>
                <h1 className="text-lg font-bold text-text-primary">{title}</h1>
                {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Notifications */}
              <button className="relative p-2 rounded-full hover:bg-[rgba(255,255,255,0.60)] transition-colors">
                <Bell className="w-5 h-5 text-text-secondary" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-error" />
              </button>

              {/* Back to site */}
              <Link
                href="/"
                className="hidden sm:flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full bg-[rgba(255,255,255,0.50)] border border-[rgba(255,255,255,0.35)] text-text-secondary hover:text-text-primary hover:bg-[rgba(255,255,255,0.80)] transition-all"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Site
              </Link>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/hooks/useAuth";
import { User, Package, MapPin, CreditCard, Store, Settings, LogOut, Shield } from "lucide-react";

function NavItem({ href, label, icon, isMobile }: { href: string; label: string; icon: React.ReactNode; isMobile?: boolean }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  if (isMobile) {
    return (
      <Link
        href={href}
        className={
          "flex items-center gap-2 px-3 py-2 text-sm font-semibold whitespace-nowrap rounded-full transition-all border " +
          (isActive
            ? "bg-[#429DFE] text-white shadow-sm border-transparent"
            : "bg-white/60 text-text-primary border-[rgba(15,23,42,0.10)] hover:bg-white/80")
        }
      >
        {icon}
        <span>{label}</span>
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={
        "flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl transition-all " +
        (isActive
          ? "bg-[#429DFE] text-white shadow-md"
          : "text-text-secondary hover:bg-[rgba(66,157,254,0.08)] hover:text-text-primary")
      }
    >
      {icon}
      {label}
    </Link>
  );
}

export default function AccountLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated, signOut } = useAuth();

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
    }
  }, [isHydrated, isAuthenticated, user, router]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) {
    return null;
  }

  const isAdmin = user.role === "super-admin";
  const firstName = user.username?.split(" ")[0] || "User";

  return (
    <div className="container mx-auto px-4 py-6 sm:py-10 sm:px-6">
      {/* Mobile: Horizontal scrollable tabs - sticky */}
      <nav className="lg:hidden sticky top-0 z-10 -mx-4 px-4 py-3 bg-background/95 backdrop-blur-md border-b border-[rgba(15,23,42,0.06)] overflow-x-auto scrollbar-hide">
        <div className="flex gap-2">
          <NavItem href="/account" label="Overview" icon={<User className="w-4 h-4" />} isMobile />
          <NavItem href="/account/orders" label="Orders" icon={<Package className="w-4 h-4" />} isMobile />
          <NavItem href="/account/addresses" label="Addresses" icon={<MapPin className="w-4 h-4" />} isMobile />
          <NavItem href="/account/payments" label="Payments" icon={<CreditCard className="w-4 h-4" />} isMobile />
          <NavItem href="/account/become-seller" label="Become a Seller" icon={<Store className="w-4 h-4" />} isMobile />
          <NavItem href="/account/seller" label="Seller Dashboard" icon={<Store className="w-4 h-4" />} isMobile />
          <NavItem href="/account/settings" label="Settings" icon={<Settings className="w-4 h-4" />} isMobile />
        </div>
      </nav>

      {/* Content area */}
      <div className="grid grid-cols-1 gap-8 mt-6 lg:mt-0 lg:grid-cols-[260px_1fr]">
        {/* Desktop: Sidebar */}
        <aside className="hidden lg:flex flex-col gap-4">
          {/* User Card */}
          <Card className="p-4 border border-[rgba(66,157,254,0.15)]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl overflow-hidden border border-[rgba(66,157,254,0.2)] shrink-0">
                {user.avatar?.url ? (
                  <img src={user.avatar.url} alt={user.username} className="h-full w-full object-cover" />
                ) : (
                  <div className="h-full w-full bg-[rgba(66,157,254,0.12)] flex items-center justify-center">
                    <span className="text-sm font-black text-[#429DFE]">{firstName[0]?.toUpperCase()}</span>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{user.username}</p>
                <p className="text-xs text-text-secondary truncate">{user.email}</p>
              </div>
            </div>
          </Card>

          {/* Navigation */}
          <nav className="space-y-1">
            <NavItem href="/account" label="Overview" icon={<User className="w-4 h-4" />} />
            <NavItem href="/account/orders" label="Orders" icon={<Package className="w-4 h-4" />} />
            <NavItem href="/account/addresses" label="Addresses" icon={<MapPin className="w-4 h-4" />} />
            <NavItem href="/account/payments" label="Payments" icon={<CreditCard className="w-4 h-4" />} />
            <NavItem href="/account/become-seller" label="Become a Seller" icon={<Store className="w-4 h-4" />} />
            <NavItem href="/account/seller" label="Seller Dashboard" icon={<Store className="w-4 h-4" />} />
            <NavItem href="/account/settings" label="Settings" icon={<Settings className="w-4 h-4" />} />
          </nav>

          {/* Admin + Sign Out */}
          <div className="mt-auto pt-4 border-t border-[rgba(15,23,42,0.08)] space-y-2">
            {isAdmin && (
              <Link href="/super-admin" className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-[#8b5cf6] hover:bg-[rgba(139,92,246,0.08)] transition-all">
                <Shield className="w-4 h-4" />
                Super Admin
              </Link>
            )}
            <button
              onClick={() => { signOut(); router.push("/"); }}
              className="flex items-center gap-3 px-4 py-3 text-sm font-semibold rounded-xl text-text-secondary hover:bg-[rgba(239,68,68,0.06)] hover:text-[#ef4444] transition-all w-full"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </aside>

        <section>{children}</section>
      </div>
    </div>
  );
}

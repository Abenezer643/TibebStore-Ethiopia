"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, DollarSign, TrendingUp, Clock, CheckCircle, ShieldCheck } from "lucide-react";

interface Payout {
  id: string;
  amount: number;
  currency: string;
  status: string;
  payoutMethod: string;
  payoutAccount: string;
  periodStart: string;
  periodEnd: string;
  orderCount: number;
  transactionRef: string;
  notes: string;
  processedAt: string;
  createdAt: string;
}

interface PayoutStats {
  totalEarnings: number;
  totalPayouts: number;
  pendingPayouts: number;
  availableBalance: number;
  escrowHeld: number;
  releasedOrderCount: number;
  heldOrderCount: number;
}

export default function SellerPayoutsPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();

  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [stats, setStats] = useState<PayoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }
    if (user.isSuspended) {
      router.replace("/account");
      return;
    }
    if (user.role !== "seller" || user.sellerStatus !== "approved") {
      router.replace("/account/become-seller");
      return;
    }

    fetchPayouts();
  }, [isHydrated, isAuthenticated, user, router]);

  const fetchPayouts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/seller/payouts?stats=true");
      const json = await res.json();
      if (res.ok) {
        setPayouts(json.payouts || []);
        setStats(json.stats || null);
      }
    } catch (error) {
      console.error("Failed to fetch payouts:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-ET", {
      style: "currency",
      currency: "ETB",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700";
      case "processing":
        return "bg-blue-100 text-blue-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-yellow-100 text-yellow-700";
    }
  };

  if (!isHydrated || isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Payouts</h2>
            <p className="mt-1 text-sm font-bold text-text-secondary uppercase">
              View payout history and manage payout settings.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/account/seller">
              <Button variant="outline">Back</Button>
            </Link>
          </div>
        </div>
      </Card>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase">Total Earnings</p>
                <p className="text-lg font-bold text-primary">{formatCurrency(stats.totalEarnings)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase">Total Paid Out</p>
                <p className="text-lg font-bold text-green-600">{formatCurrency(stats.totalPayouts)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase">Pending</p>
                <p className="text-lg font-bold text-yellow-600">{formatCurrency(stats.pendingPayouts)}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase">Available</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(Math.max(0, stats.availableBalance))}</p>
              </div>
            </div>
          </Card>

          <Card className="p-4 sm:col-span-2 lg:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-text-secondary uppercase">Held in Escrow</p>
                <p className="text-lg font-bold text-amber-600">{formatCurrency(stats.escrowHeld || 0)}</p>
                <p className="text-xs text-text-secondary">{stats.heldOrderCount || 0} orders awaiting delivery</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Payouts List */}
      <Card className="p-6">
        <h3 className="text-sm font-black uppercase tracking-tight mb-4">Payout History</h3>

        {payouts.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm font-bold text-text-secondary uppercase">No payouts yet.</p>
            <p className="text-xs text-text-secondary mt-2">
              Payouts will appear here once orders are completed and processed.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {payouts.map((payout) => (
              <div
                key={payout.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[rgba(255,255,255,0.50)] border border-[rgba(15,23,42,0.10)]"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-primary">{formatCurrency(payout.amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(payout.status)}`}>
                      {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-text-secondary mt-1">
                    {formatDate(payout.periodStart)} - {formatDate(payout.periodEnd)}
                  </p>
                  <p className="text-xs text-text-secondary">
                    {payout.orderCount} orders • {payout.payoutMethod}: {payout.payoutAccount}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-text-secondary">
                    Created {formatDate(payout.createdAt)}
                  </p>
                  {payout.processedAt && (
                    <p className="text-xs text-text-secondary">
                      Processed {formatDate(payout.processedAt)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, Clock, ArrowDownUp, ShieldCheck, RotateCcw, Zap, Database } from "lucide-react";

interface CommissionSummary {
  totalPayments: number;
  paymentCount: number;
  totalCommission: number;
  commissionCount: number;
  pendingPayouts: number;
  pendingPayoutCount: number;
  completedPayouts: number;
  completedPayoutCount: number;
  totalRefunds: number;
  refundCount: number;
  escrowHeld: number;
  escrowCount: number;
}

interface RecentTransaction {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string;
  createdAt: string;
}

export default function CommissionsPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [summary, setSummary] = useState<CommissionSummary | null>(null);
  const [transactions, setTransactions] = useState<RecentTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isBackfilling, setIsBackfilling] = useState(false);
  const [period, setPeriod] = useState("all");

  useEffect(() => {
    if (!isHydrated) return;
    if (!isAuthenticated || !user) {
      router.replace("/sign-in");
      return;
    }
    if (user.role !== "super-admin") {
      router.replace("/account");
      return;
    }
  }, [isHydrated, isAuthenticated, user, router]);

  const fetchData = async () => {
    if (!isHydrated || !isAuthenticated || !user || user.role !== "super-admin") return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/commissions?period=${period}`);
      const json = await res.json();
      if (res.ok) {
        setSummary(json.summary);
        setTransactions(json.recentTransactions || []);
      } else {
        toast("error", "Failed to load commission data");
      }
    } catch {
      toast("error", "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isHydrated, isAuthenticated, user, period]);

  if (!isHydrated || !isAuthenticated || !user || user.role !== "super-admin") return null;

  const typeIcon: Record<string, any> = {
    payment: DollarSign,
    commission: TrendingUp,
    payout: ArrowDownUp,
    refund: RotateCcw,
  };

  const typeLabel: Record<string, string> = {
    payment: "Payment",
    commission: "Commission",
    payout: "Payout",
    refund: "Refund",
  };

  const statusColor: Record<string, string> = {
    completed: "bg-[#10b981]",
    pending: "bg-[#f59e0b]",
    failed: "bg-[#ef4444]",
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">Commissions & Escrow</h2>
            <p className="mt-1 text-sm font-bold text-text-secondary uppercase">
              Platform revenue and fund management
            </p>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="h-10 rounded-lg border border-[rgba(15,23,42,0.12)] bg-[rgba(255,255,255,0.70)] px-3 text-sm font-semibold"
            >
              <option value="all">All Time</option>
              <option value="month">This Month</option>
              <option value="week">This Week</option>
            </select>
            <Button
              variant="secondary"
              onClick={async () => {
                setIsBackfilling(true);
                try {
                  const res = await fetch("/api/admin/migrations/escrow-backfill", { method: "POST" });
                  const json = await res.json();
                  if (res.ok) {
                    toast("success", `Backfill done: ${json.updated} orders updated`);
                    fetchData();
                  } else {
                    toast("error", json.error || "Backfill failed");
                  }
                } catch {
                  toast("error", "Network error");
                } finally {
                  setIsBackfilling(false);
                }
              }}
              disabled={isBackfilling}
            >
              <Database className="w-4 h-4 mr-1" />
              {isBackfilling ? "Backfilling..." : "Backfill Commission"}
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                setIsProcessing(true);
                try {
                  const res = await fetch("/api/system/escrow-cron", { method: "POST" });
                  const json = await res.json();
                  if (res.ok) {
                    const r = json.results || json;
                    toast("success", `Processed: ${r.refunded || 0} refunded, ${r.released || 0} released, ${r.errors || 0} errors`);
                    fetchData();
                  } else {
                    toast("error", json.error || "Failed to process");
                  }
                } catch {
                  toast("error", "Network error");
                } finally {
                  setIsProcessing(false);
                }
              }}
              disabled={isProcessing}
            >
              <Zap className="w-4 h-4 mr-1" />
              {isProcessing ? "Processing..." : "Process Overdue Orders"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/super-admin")}>Back</Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(16,185,129,0.10)]">
              <TrendingUp className="h-5 w-5 text-[#10b981]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight text-text-secondary">Commission Earned</p>
              <p className="text-xl font-black text-text-primary">{summary ? formatCurrency(summary.totalCommission) : "—"}</p>
              <p className="text-xs text-text-secondary">{summary?.commissionCount ?? 0} orders</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(66,157,254,0.10)]">
              <DollarSign className="h-5 w-5 text-[#429DFE]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight text-text-secondary">Total Payments</p>
              <p className="text-xl font-black text-text-primary">{summary ? formatCurrency(summary.totalPayments) : "—"}</p>
              <p className="text-xs text-text-secondary">{summary?.paymentCount ?? 0} transactions</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(245,158,11,0.10)]">
              <ShieldCheck className="h-5 w-5 text-[#f59e0b]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight text-text-secondary">Escrow Held</p>
              <p className="text-xl font-black text-text-primary">{summary ? formatCurrency(summary.escrowHeld) : "—"}</p>
              <p className="text-xs text-text-secondary">{summary?.escrowCount ?? 0} orders</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(139,92,246,0.10)]">
              <ArrowDownUp className="h-5 w-5 text-[#8b5cf6]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight text-text-secondary">Pending Payouts</p>
              <p className="text-xl font-black text-text-primary">{summary ? formatCurrency(summary.pendingPayouts) : "—"}</p>
              <p className="text-xs text-text-secondary">{summary?.pendingPayoutCount ?? 0} sellers</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(16,185,129,0.10)]">
              <ArrowDownUp className="h-5 w-5 text-[#10b981]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight text-text-secondary">Completed Payouts</p>
              <p className="text-xl font-black text-text-primary">{summary ? formatCurrency(summary.completedPayouts) : "—"}</p>
              <p className="text-xs text-text-secondary">{summary?.completedPayoutCount ?? 0} payouts</p>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-[rgba(239,68,68,0.10)]">
              <RotateCcw className="h-5 w-5 text-[#ef4444]" />
            </div>
            <div>
              <p className="text-xs font-black uppercase tracking-tight text-text-secondary">Total Refunds</p>
              <p className="text-xl font-black text-text-primary">{summary ? formatCurrency(summary.totalRefunds) : "—"}</p>
              <p className="text-xs text-text-secondary">{summary?.refundCount ?? 0} refunds</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Transactions */}
      <Card className="p-6">
        <h3 className="text-lg font-black uppercase tracking-tight mb-4">Recent Transactions</h3>
        {isLoading ? (
          <p className="text-sm text-text-secondary">Loading...</p>
        ) : transactions.length === 0 ? (
          <p className="text-sm text-text-secondary">No transactions yet.</p>
        ) : (
          <div className="space-y-3">
            {transactions.map((t) => {
              const Icon = typeIcon[t.type] || DollarSign;
              return (
                <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.10)]">
                  <div className="p-2 rounded-lg bg-[rgba(66,157,254,0.06)]">
                    <Icon className="h-4 w-4 text-[#429DFE]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{t.description}</p>
                    <p className="text-xs text-text-secondary">{new Date(t.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`${statusColor[t.status] || "bg-gray-400"} text-white border-0 text-xs`}>
                      {t.status}
                    </Badge>
                    <span className="text-sm font-bold">{formatCurrency(t.amount)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

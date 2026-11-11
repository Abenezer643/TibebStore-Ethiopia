"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { Store, CheckCircle, Clock, XCircle, ArrowRight, DollarSign, FileText, MapPin } from "lucide-react";

export default function BecomeSellerPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isHydrated, isAuthenticated, refresh } = useAuth();

  const [storeName, setStoreName] = useState("");
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Ethiopia");
  const [city, setCity] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [payoutMethod, setPayoutMethod] = useState<"bank" | "paypal">("bank");
  const [payoutAccount, setPayoutAccount] = useState("");
  const [idDocumentName, setIdDocumentName] = useState<string | undefined>(undefined);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const status = user?.sellerStatus ?? "none";

  const statusBadge = useMemo(() => {
    if (status === "approved") return <Badge variant="success">approved</Badge>;
    if (status === "pending") return <Badge variant="warning">pending</Badge>;
    if (status === "rejected") return <Badge variant="outline">rejected</Badge>;
    return <Badge variant="outline">not submitted</Badge>;
  }, [status]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) {
    router.replace("/sign-in");
    return null;
  }

  const canSubmit = status !== "approved" && status !== "pending";

  const onCancelRequest = async () => {
    setIsCancelling(true);
    try {
      const res = await fetch("/api/seller/cancel-request", { method: "POST" });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to cancel request");
      await refresh();
      toast("success", "Request cancelled");
    } catch {
      toast("error", "Something went wrong. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!canSubmit) {
      return;
    }

    if (!storeName.trim() || storeName.trim().length < 3) {
      toast("error", "Store name must be at least 3 characters");
      return;
    }

    if (!phone.trim() || phone.trim().length < 7) {
      toast("error", "Please enter a valid phone number");
      return;
    }

    if (!city.trim()) {
      toast("error", "City is required");
      return;
    }

    if (!addressLine1.trim()) {
      toast("error", "Address line 1 is required");
      return;
    }

    if (!payoutAccount.trim()) {
      toast("error", payoutMethod === "bank" ? "Bank account is required" : "PayPal email is required");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/seller/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          storeName,
          phone,
          country,
          city,
          addressLine1,
          addressLine2: addressLine2 || undefined,
          payoutMethod,
          payoutAccount,
          idDocumentName,
        }),
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) {
        throw new Error(json?.error ?? "Failed to submit request");
      }
      await refresh();
      toast("success", "Application submitted! Waiting for approval.");
    } catch {
      toast("error", "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 border border-[rgba(139,92,246,0.2)] bg-gradient-to-br from-[rgba(139,92,246,0.06)] to-[rgba(255,255,255,0.70)]">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgba(139,92,246,0.12)] flex items-center justify-center">
              <Store className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight">Become a Seller</h2>
              <p className="text-sm text-text-secondary mt-0.5">Submit your details. A super admin will approve your request.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-black uppercase tracking-tight">status</span>
            {statusBadge}
          </div>
        </div>
      </Card>

      {status === "approved" ? (
        <Card className="p-6 border border-[rgba(16,185,129,0.2)] bg-gradient-to-br from-[rgba(16,185,129,0.04)] to-[rgba(255,255,255,0.70)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(16,185,129,0.12)] flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-[#10b981]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black uppercase tracking-tight">You're approved!</h3>
              <p className="text-sm text-text-secondary mt-0.5">You can now access the Seller Dashboard.</p>
            </div>
            <Button variant="secondary" onClick={() => router.push("/account/seller")}>
              Open Dashboard <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </Card>
      ) : null}

      {status === "pending" ? (
        <Card className="p-6 border border-[rgba(245,158,11,0.2)] bg-gradient-to-br from-[rgba(245,158,11,0.04)] to-[rgba(255,255,255,0.70)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(245,158,11,0.12)] flex items-center justify-center">
              <Clock className="w-6 h-6 text-[#f59e0b]" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-black uppercase tracking-tight">Application pending</h3>
              <p className="text-sm text-text-secondary mt-0.5">Please wait for review. If you made a mistake, cancel and submit again.</p>
            </div>
            <Button type="button" variant="outline" isLoading={isCancelling} onClick={onCancelRequest}>
              Cancel request
            </Button>
          </div>
        </Card>
      ) : null}

      {status === "rejected" ? (
        <Card className="p-6 border border-[rgba(239,68,68,0.2)] bg-gradient-to-br from-[rgba(239,68,68,0.04)] to-[rgba(255,255,255,0.70)]">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[rgba(239,68,68,0.12)] flex items-center justify-center">
              <XCircle className="w-6 h-6 text-[#ef4444]" />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tight">Application rejected</h3>
              <p className="text-sm text-text-secondary mt-0.5">Update your information and submit again.</p>
            </div>
          </div>
        </Card>
      ) : null}

      <Card className="p-6">
        <form onSubmit={onSubmit} className="space-y-6">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Input
              label="Store Name"
              type="text"
              placeholder="Your shop name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
            />
            <Input
              label="Phone"
              type="tel"
              placeholder="+251..."
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            <Input
              label="Country"
              type="text"
              placeholder="Country"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            />
            <Input
              label="City"
              type="text"
              placeholder="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <Input
              label="Address Line 1"
              type="text"
              placeholder="Street, house number, etc."
              value={addressLine1}
              onChange={(e) => setAddressLine1(e.target.value)}
            />
            <Input
              label="Address Line 2 (optional)"
              type="text"
              placeholder="Apartment, suite, etc."
              value={addressLine2}
              onChange={(e) => setAddressLine2(e.target.value)}
            />
          </div>

          <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md p-4 space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-tight">Payout Method</p>
                <p className="text-xs font-bold text-text-secondary uppercase mt-1">
                  Where you want to receive payments.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={payoutMethod === "bank" ? "secondary" : "outline"}
                  onClick={() => setPayoutMethod("bank")}
                >
                  Bank
                </Button>
                <Button
                  type="button"
                  variant={payoutMethod === "paypal" ? "secondary" : "outline"}
                  onClick={() => setPayoutMethod("paypal")}
                >
                  PayPal
                </Button>
              </div>
            </div>

            <Input
              label={payoutMethod === "bank" ? "Bank Account Number" : "PayPal Email"}
              type={payoutMethod === "bank" ? "text" : "email"}
              placeholder={payoutMethod === "bank" ? "Account number" : "paypal@email.com"}
              value={payoutAccount}
              onChange={(e) => setPayoutAccount(e.target.value)}
            />
          </div>

          <div className="rounded-xl bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md p-4 space-y-3">
            <div>
              <p className="text-sm font-black uppercase tracking-tight">Identity Document</p>
            </div>
            <input
              type="file"
              accept="image/*,.pdf"
              className="block w-full text-sm font-bold"
              onChange={(e) => {
                const file = e.target.files?.[0];
                setIdDocumentName(file?.name);
              }}
            />
            {idDocumentName ? (
              <p className="text-xs font-bold text-text-secondary uppercase">Selected: {idDocumentName}</p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-text-secondary uppercase">
              By submitting, you agree to follow TibebStore seller policies.
            </p>
            <Button type="submit" variant="secondary" isLoading={isSubmitting} disabled={!canSubmit || isSubmitting}>
              {status === "rejected" ? "Submit Again" : status === "none" ? "Submit Application" : "Submit Application"}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

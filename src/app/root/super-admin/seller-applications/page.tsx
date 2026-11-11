"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { useAdminSellerApplications } from "@/hooks/useAdminSellerApplications";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { CheckCircle, XCircle, Clock, User, Building2, MapPin, Phone, CreditCard, FileText, ArrowRight } from "lucide-react";

function StatusBadge({ status }: { status: "pending" | "approved" | "rejected" }) {
  if (status === "approved") return <Badge className="bg-[#10b981] text-white border-0">Approved</Badge>;
  if (status === "pending") return <Badge className="bg-[#f59e0b] text-white border-0">Pending</Badge>;
  return <Badge className="bg-[#ef4444] text-white border-0">Rejected</Badge>;
}

export default function SellerApplicationsAdminPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const { applications, review: reviewApplication } = useAdminSellerApplications();

  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  const isAdmin = user?.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const pending = useMemo(() => applications.filter((a) => a.status === "pending"), [applications]);
  const reviewed = useMemo(() => applications.filter((a) => a.status !== "pending"), [applications]);

  const selected = useMemo(() => {
    if (!selectedEmail) return null;
    return applications.find((a) => a.email === selectedEmail) ?? null;
  }, [applications, selectedEmail]);

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

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;
  if (!isAdmin) return null;

  const selectApp = (email: string) => {
    setSelectedEmail(email);
  };

  const onReview = async (status: "approved" | "rejected") => {
    if (!selected) return;
    await reviewApplication(selected.id, { status, reviewNotes: notes });
    toast("success", `Application ${status}`);
    setSelectedEmail(null);
    setNotes("");
  };

  return (
    <AdminLayout title="Applications" subtitle="Review seller requests">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="default" className="p-4 border border-[rgba(245,158,11,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Pending</p>
                <p className="text-xl font-bold text-warning">{pending.length}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Approved</p>
                <p className="text-xl font-bold text-success">{applications.filter(a => a.status === "approved").length}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                <XCircle className="w-5 h-5 text-error" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Rejected</p>
                <p className="text-xl font-bold text-error">{applications.filter(a => a.status === "rejected").length}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
          {/* Applications List */}
          <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
            <div className="p-4 border-b border-[rgba(255,255,255,0.35)]">
              <h3 className="text-lg font-bold text-text-primary">Pending Applications</h3>
              <p className="text-sm text-text-secondary">Click to review</p>
            </div>
            <div className="p-4 space-y-3">
              {pending.length === 0 ? (
                <div className="p-8 text-center text-sm text-text-secondary rounded-xl bg-[rgba(255,255,255,0.30)] border border-[rgba(255,255,255,0.35)]">No pending applications</div>
              ) : (
                pending.map((app) => (
                  <button
                    key={app.id}
                    type="button"
                    onClick={() => selectApp(app.email)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedEmail === app.email 
                        ? "bg-[rgba(46,144,250,0.1)] border-primary shadow-[0_4px_16px_rgba(46,144,250,0.2)]" 
                        : "bg-[rgba(255,255,255,0.50)] border-[rgba(255,255,255,0.50)] hover:bg-[rgba(255,255,255,0.80)] hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#429DFE] flex items-center justify-center shadow-md">
                          <span className="text-sm font-bold text-white">{app.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{app.username}</p>
                          <p className="text-xs text-text-secondary">{app.email}</p>
                        </div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-text-secondary" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {reviewed.length > 0 && (
              <>
                <div className="px-4 py-3 border-t border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.30)]">
                  <h3 className="text-sm font-semibold text-text-secondary">Reviewed ({reviewed.length})</h3>
                </div>
                <div className="p-4 space-y-3">
                  {reviewed.map((app) => (
                    <div key={app.id} className="p-4 rounded-xl bg-[rgba(255,255,255,0.50)] border border-[rgba(255,255,255,0.50)] shadow-sm">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-[rgba(255,255,255,0.80)] border border-[rgba(255,255,255,0.50)] flex items-center justify-center shadow-sm">
                            <span className="text-sm font-bold text-text-secondary">{app.username.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{app.username}</p>
                            <p className="text-xs text-text-secondary">{app.email}</p>
                          </div>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {/* Review Panel */}
          <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] shadow-[0_8px_32px_rgba(0,0,0,0.10)]">
            <div className="p-4 border-b border-[rgba(255,255,255,0.35)]">
              <h3 className="text-lg font-bold text-text-primary">Review Application</h3>
              <p className="text-sm text-text-secondary">Select an application to review</p>
            </div>

            <div className="p-4">
              {!selected ? (
                <div className="p-8 text-center rounded-xl bg-[rgba(255,255,255,0.30)]">
                  <User className="w-12 h-12 text-text-secondary mx-auto mb-3" />
                  <p className="text-sm text-text-secondary">No application selected</p>
                  <p className="text-xs text-text-secondary mt-1">Click on a pending application to review</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Selected App Details */}
                  <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.30)]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#429DFE] flex items-center justify-center shadow-md">
                          <span className="text-lg font-bold text-white">{selected.username.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <p className="text-sm font-bold text-text-primary">{selected.storeName}</p>
                          <p className="text-xs text-text-secondary">{selected.email}</p>
                        </div>
                      </div>
                      <StatusBadge status={selected.status} />
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-text-secondary">
                        <User className="w-4 h-4" />
                        <span>{selected.username}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Building2 className="w-4 h-4" />
                        <span>{selected.storeSlug}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <Phone className="w-4 h-4" />
                        <span>{selected.phone}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <MapPin className="w-4 h-4" />
                        <span>{selected.city}, {selected.country}</span>
                      </div>
                      <div className="flex items-center gap-2 text-text-secondary">
                        <CreditCard className="w-4 h-4" />
                        <span>{selected.payoutMethod} ({selected.payoutAccount})</span>
                      </div>
                      {selected.idDocumentName && (
                        <div className="flex items-center gap-2 text-text-secondary">
                          <FileText className="w-4 h-4" />
                          <span>{selected.idDocumentName}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes Input */}
                  <div>
                    <label className="block text-sm font-medium text-text-primary mb-2">Review Notes (optional)</label>
                    <Input
                      type="text"
                      placeholder="Add notes..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2">
                    <Button variant="primary" className="w-full bg-[#10b981] hover:bg-[#059669]" onClick={() => void onReview("approved")}>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Application
                    </Button>
                    <Button variant="destructive" className="w-full" onClick={() => void onReview("rejected")}>
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject Application
                    </Button>
                    <Button variant="outline" className="w-full" onClick={() => setSelectedEmail(null)}>
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

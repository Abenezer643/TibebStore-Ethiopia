"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { useAuth } from "@/hooks/useAuth";
import { 
  Flag, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Store,
  Package,
  ChevronDown,
  Filter,
  Eye,
  Trash2,
  MessageCircle,
} from "lucide-react";

type Report = {
  _id: string;
  productId: string;
  productName: string;
  tenantSlug: string;
  tenantName: string;
  reporterId?: string;
  reporterEmail?: string;
  reason: string;
  message: string;
  status: "open" | "reviewed" | "resolved";
  createdAt: string;
  reviewedAt?: string;
  adminNotes?: string;
};

const reasonLabels: Record<string, string> = {
  scam: "Scam / Misleading",
  inappropriate: "Inappropriate Content",
  copyright: "Copyright / Stolen Photos",
  "wrong-category": "Wrong Category",
  other: "Other",
};

const statusColors: Record<string, "warning" | "info" | "success"> = {
  open: "warning",
  reviewed: "info",
  resolved: "success",
};

export default function SuperAdminReportsPage() {
  const { user } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const url = filter === "all" ? "/api/reports" : `/api/reports?status=${filter}`;
      const res = await fetch(url);
      const json = await res.json();
      if (res.ok) {
        setReports(json.reports || []);
      }
    } catch (error) {
      console.error("Failed to fetch reports:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filter]);

  const updateReportStatus = async (reportId: string, status: "reviewed" | "resolved", adminNotes?: string) => {
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, adminNotes }),
      });
      
      if (res.ok) {
        fetchReports();
        setSelectedReport(null);
      }
    } catch (error) {
      console.error("Failed to update report:", error);
    }
  };

  const deleteReport = async (reportId: string) => {
    if (!confirm("Are you sure you want to delete this report?")) return;
    
    try {
      const res = await fetch(`/api/reports/${reportId}`, { method: "DELETE" });
      if (res.ok) {
        fetchReports();
        setSelectedReport(null);
      }
    } catch (error) {
      console.error("Failed to delete report:", error);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <AdminLayout title="Reports" subtitle="Manage reported listings">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-text-primary">Reports</h1>
            <p className="text-text-secondary mt-1">Manage reported listings</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-secondary" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="rounded-lg border border-[rgba(15,23,42,0.10)] px-3 py-2 text-sm"
              >
                <option value="all">All Reports</option>
                <option value="open">Open</option>
                <option value="reviewed">Reviewed</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-100">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Open</p>
                <p className="text-2xl font-bold text-text-primary">
                  {reports.filter(r => r.status === "open").length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Reviewed</p>
                <p className="text-2xl font-bold text-text-primary">
                  {reports.filter(r => r.status === "reviewed").length}
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-text-secondary">Resolved</p>
                <p className="text-2xl font-bold text-text-primary">
                  {reports.filter(r => r.status === "resolved").length}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Reports List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-text-secondary">Loading reports...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card className="p-12 text-center">
            <Flag className="h-12 w-12 text-text-secondary mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-text-primary">No Reports</h3>
            <p className="text-text-secondary mt-1">No reports match the current filter.</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <Card key={report._id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Badge variant={statusColors[report.status]}>
                        {report.status.charAt(0).toUpperCase() + report.status.slice(1)}
                      </Badge>
                      <span className="text-sm text-text-secondary">
                        {formatDate(report.createdAt)}
                      </span>
                    </div>
                    
                    <h3 className="font-semibold text-text-primary">{report.productName}</h3>
                    
                    <div className="flex items-center gap-4 mt-2 text-sm text-text-secondary">
                      <div className="flex items-center gap-1">
                        <Store className="h-4 w-4" />
                        {report.tenantName || report.tenantSlug}
                      </div>
                      <div className="flex items-center gap-1">
                        <Flag className="h-4 w-4" />
                        {reasonLabels[report.reason] || report.reason}
                      </div>
                    </div>
                    
                    {report.message && (
                      <p className="mt-2 text-sm text-text-secondary bg-secondary/10 rounded-lg p-2">
                        {report.message}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedReport(report)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Report Detail Modal */}
        {selectedReport && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="max-w-lg w-full p-6 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-text-primary">Report Details</h2>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="text-text-secondary hover:text-text-primary"
                >
                  ×
                </button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-text-secondary">Product</p>
                  <p className="font-semibold text-text-primary">{selectedReport.productName}</p>
                </div>
                
                <div>
                  <p className="text-sm text-text-secondary">Store</p>
                  <p className="font-semibold text-text-primary">{selectedReport.tenantName || selectedReport.tenantSlug}</p>
                </div>
                
                <div>
                  <p className="text-sm text-text-secondary">Reason</p>
                  <Badge variant={statusColors[selectedReport.status]}>
                    {reasonLabels[selectedReport.reason] || selectedReport.reason}
                  </Badge>
                </div>
                
                {selectedReport.message && (
                  <div>
                    <p className="text-sm text-text-secondary">Details</p>
                    <p className="text-text-primary bg-secondary/10 rounded-lg p-3">
                      {selectedReport.message}
                    </p>
                  </div>
                )}
                
                {selectedReport.reporterEmail && (
                  <div>
                    <p className="text-sm text-text-secondary">Reporter</p>
                    <p className="text-text-primary">{selectedReport.reporterEmail}</p>
                  </div>
                )}
                
                <div>
                  <p className="text-sm text-text-secondary">Status</p>
                  <Badge variant={statusColors[selectedReport.status]}>
                    {selectedReport.status.charAt(0).toUpperCase() + selectedReport.status.slice(1)}
                  </Badge>
                </div>
                
                <div className="pt-4 border-t border-[rgba(15,23,42,0.10)]">
                  <p className="text-sm text-text-secondary mb-2">Actions</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedReport.status === "open" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateReportStatus(selectedReport._id, "reviewed")}
                      >
                        <Clock className="h-4 w-4 mr-1" />
                        Mark Reviewed
                      </Button>
                    )}
                    {selectedReport.status !== "resolved" && (
                      <Button
                        size="sm"
                        onClick={() => updateReportStatus(selectedReport._id, "resolved")}
                      >
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Mark Resolved
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500 hover:text-red-600"
                      onClick={() => deleteReport(selectedReport._id)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
                
                <div className="pt-4">
                  <a
                    href={`/products/${selectedReport.productId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1"
                  >
                    <Package className="h-4 w-4" />
                    View Product
                  </a>
                  <a
                    href={`/tenant/${selectedReport.tenantSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline text-sm flex items-center gap-1 mt-2"
                  >
                    <Store className="h-4 w-4" />
                    View Store
                  </a>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}

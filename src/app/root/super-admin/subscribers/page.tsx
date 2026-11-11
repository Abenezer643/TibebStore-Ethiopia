"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Search, Users, Mail, Calendar } from "lucide-react";

type Subscriber = {
  id: string;
  email: string;
  subscribedAt: string;
};

export default function AdminSubscribersPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");

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

    const fetchSubscribers = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/newsletter");
        const json = await res.json().catch(() => null);
        if (res.ok && Array.isArray(json?.subscribers)) {
          setSubscribers(json.subscribers);
        }
      } catch (error) {
        console.error("Failed to fetch subscribers:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSubscribers();
  }, [isHydrated, isAdmin]);

  const filteredSubscribers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return subscribers;
    return subscribers.filter((s) =>
      s.email.toLowerCase().includes(normalized)
    );
  }, [query, subscribers]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;
  if (!isAdmin) return null;

  return (
    <AdminLayout title="Newsletter Subscribers" subtitle="Email list for marketing">
      <div className="space-y-6">
        {/* Stats */}
        <Card variant="default" className="p-4 border border-[rgba(255,255,255,0.35)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
              <Users className="w-5 h-5 text-success" />
            </div>
            <div>
              <p className="text-xs text-text-secondary">Total Subscribers</p>
              <p className="text-xl font-bold text-success">{subscribers.length}</p>
            </div>
          </div>
        </Card>

        {/* Search */}
        <Card variant="elevated" className="p-4 border border-[rgba(255,255,255,0.35)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              placeholder="Search by email..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11"
            />
          </div>
        </Card>

        {/* Subscribers List */}
        <Card variant="elevated" className="p-6 border border-[rgba(255,255,255,0.35)]">
          <h3 className="text-sm font-black uppercase tracking-tight mb-4">All Subscribers</h3>
          
          {isLoading ? (
            <p className="text-sm text-text-secondary">Loading...</p>
          ) : filteredSubscribers.length === 0 ? (
            <p className="text-sm text-text-secondary">No subscribers found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-[rgba(15,23,42,0.10)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-text-secondary uppercase">Subscribed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[rgba(15,23,42,0.10)]">
                  {filteredSubscribers.map((s) => (
                    <tr key={s.id} className="hover:bg-[rgba(255,255,255,0.30)] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-text-secondary" />
                          <span className="text-sm text-text-primary">{s.email}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 text-xs text-text-secondary">
                          <Calendar className="w-3 h-3" />
                          {new Date(s.subscribedAt).toLocaleDateString()}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
}

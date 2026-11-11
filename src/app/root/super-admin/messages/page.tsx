"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Search, Mail, MessageSquare, Clock, CheckCircle } from "lucide-react";

type ContactMessage = {
  id: string;
  name: string;
  email: string;
  topic: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function AdminMessagesPage() {
  const router = useRouter();
  const { user, isHydrated, isAuthenticated } = useAuth();
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

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

    const fetchMessages = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("/api/admin/contact-messages");
        const json = await res.json().catch(() => null);
        if (res.ok && Array.isArray(json?.messages)) {
          setMessages(json.messages);
        }
      } catch (error) {
        console.error("Failed to fetch messages:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMessages();
  }, [isHydrated, isAdmin]);

  const filteredMessages = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return messages;
    return messages.filter((m) =>
      m.name.toLowerCase().includes(normalized) ||
      m.email.toLowerCase().includes(normalized) ||
      m.topic.toLowerCase().includes(normalized) ||
      m.message.toLowerCase().includes(normalized)
    );
  }, [query, messages]);

  const selectedMessage = useMemo(() => {
    return messages.find((m) => m.id === selectedId) ?? null;
  }, [messages, selectedId]);

  // Mark message as read when selected
  useEffect(() => {
    if (!selectedId) return;
    const msg = messages.find((m) => m.id === selectedId);
    if (msg && !msg.isRead) {
      // Mark as read in database
      fetch(`/api/admin/contact-messages/${selectedId}`, { method: "PATCH" })
        .then((res) => res.json())
        .then((data) => {
          if (data.ok) {
            // Update local state
            setMessages((prev) =>
              prev.map((m) => (m.id === selectedId ? { ...m, isRead: true } : m))
            );
          }
        })
        .catch((err) => console.error("Failed to mark as read:", err));
    }
  }, [selectedId, messages]);

  const stats = useMemo(() => {
    const total = messages.length;
    const unread = messages.filter((m) => !m.isRead).length;
    const read = messages.filter((m) => m.isRead).length;
    return { total, unread, read };
  }, [messages]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;
  if (!isAdmin) return null;

  return (
    <AdminLayout title="Messages" subtitle="Contact form submissions">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card variant="default" className="p-4 border border-[rgba(255,255,255,0.35)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(46,144,250,0.15)] flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Total Messages</p>
                <p className="text-xl font-bold text-text-primary">{stats.total}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(245,158,11,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Unread</p>
                <p className="text-xl font-bold text-warning">{stats.unread}</p>
              </div>
            </div>
          </Card>
          <Card variant="default" className="p-4 border border-[rgba(16,185,129,0.2)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(16,185,129,0.15)] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-text-secondary">Read</p>
                <p className="text-xl font-bold text-success">{stats.read}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Search */}
        <Card variant="elevated" className="p-4 border border-[rgba(255,255,255,0.35)]">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-text-secondary" />
            <Input
              placeholder="Search by name, email, topic..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-11"
            />
          </div>
        </Card>

        {/* Messages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6">
          {/* Messages List */}
          <Card variant="elevated" className="p-6 border border-[rgba(255,255,255,0.35)]">
            <h3 className="text-sm font-black uppercase tracking-tight mb-4">All Messages</h3>
            
            {isLoading ? (
              <p className="text-sm text-text-secondary">Loading...</p>
            ) : filteredMessages.length === 0 ? (
              <p className="text-sm text-text-secondary">No messages found.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {filteredMessages.map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedId(m.id)}
                    className={`w-full text-left p-4 rounded-xl border transition-all ${
                      selectedId === m.id
                        ? "bg-[rgba(66,157,254,0.10)] border-primary"
                        : "bg-[rgba(255,255,255,0.60)] border-[rgba(15,23,42,0.10)] hover:bg-[rgba(255,255,255,0.80)]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          {!m.isRead && (
                            <span className="w-2 h-2 rounded-full bg-warning shrink-0" />
                          )}
                          <p className="text-sm font-semibold text-text-primary truncate">
                            {m.name}
                          </p>
                        </div>
                        <p className="text-xs text-text-secondary truncate">{m.email}</p>
                        <p className="text-xs text-text-secondary mt-1">
                          {new Date(m.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant="outline" className="shrink-0">{m.topic}</Badge>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </Card>

          {/* Message Detail */}
          <Card variant="elevated" className="p-6 border border-[rgba(255,255,255,0.35)]">
            <h3 className="text-sm font-black uppercase tracking-tight mb-4">Message Details</h3>
            
            {!selectedMessage ? (
              <p className="text-sm text-text-secondary">Select a message to view details.</p>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.10)]">
                  <div className="flex items-center gap-3 mb-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <div>
                      <p className="text-sm font-semibold text-text-primary">{selectedMessage.name}</p>
                      <p className="text-xs text-text-secondary">{selectedMessage.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-text-secondary">
                    <Badge variant="outline">{selectedMessage.topic}</Badge>
                    <span>•</span>
                    <span>{new Date(selectedMessage.createdAt).toLocaleString()}</span>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-[rgba(255,255,255,0.60)] border border-[rgba(15,23,42,0.10)]">
                  <p className="text-sm text-text-primary whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>

                <div className="flex gap-3">
                  <a
                    href={`mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.topic}`}
                    className="flex-1"
                  >
                    <Button variant="primary" className="w-full">
                      Reply via Email
                    </Button>
                  </a>
                </div>
              </div>
            )}
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}

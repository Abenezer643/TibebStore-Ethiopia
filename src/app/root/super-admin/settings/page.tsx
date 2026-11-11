"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { SUPER_ADMIN_EMAIL, useAuth } from "@/hooks/useAuth";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Settings, Save, RotateCcw, Shield, Bell, Palette, Globe } from "lucide-react";

const KEY = "tibeb_admin_settings_v1";

type AdminSettings = {
  platformName: string;
  supportEmail: string;
  maintenanceMode: "on" | "off";
};

function readSettings(): AdminSettings {
  if (typeof window === "undefined") {
    return { platformName: "TibebStore", supportEmail: "support@tibebstore.com", maintenanceMode: "off" };
  }
  const raw = localStorage.getItem(KEY);
  if (!raw) return { platformName: "TibebStore", supportEmail: "support@tibebstore.com", maintenanceMode: "off" };
  try {
    const parsed = JSON.parse(raw) as AdminSettings;
    return parsed;
  } catch {
    return { platformName: "TibebStore", supportEmail: "support@tibebstore.com", maintenanceMode: "off" };
  }
}

function writeSettings(value: AdminSettings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(value));
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, isHydrated, isAuthenticated } = useAuth();

  const isAdmin = user?.email.trim().toLowerCase() === SUPER_ADMIN_EMAIL;

  const [form, setForm] = useState<AdminSettings>(() => readSettings());

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

  const canSave = useMemo(() => {
    return form.platformName.trim().length > 1 && form.supportEmail.trim().includes("@");
  }, [form]);

  if (!isHydrated) return null;
  if (!isAuthenticated || !user) return null;
  if (!isAdmin) return null;

  const save = () => {
    if (!canSave) return;
    writeSettings(form);
    toast("success", "Settings saved");
  };

  return (
    <AdminLayout title="Settings" subtitle="Platform configuration">
      <div className="space-y-6">
        {/* General Settings */}
        <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="p-6 border-b border-[rgba(255,255,255,0.35)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(46,144,250,0.15)] flex items-center justify-center">
                <Settings className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">General Settings</h3>
                <p className="text-sm text-text-secondary">Configure platform basics</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Platform Name</label>
                <Input
                  value={form.platformName}
                  onChange={(e) => setForm((p) => ({ ...p, platformName: e.target.value }))}
                  placeholder="Platform name"
                />
                <p className="mt-1 text-xs text-text-secondary">Display name for the marketplace</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">Support Email</label>
                <Input
                  value={form.supportEmail}
                  onChange={(e) => setForm((p) => ({ ...p, supportEmail: e.target.value }))}
                  placeholder="support@..."
                />
                <p className="mt-1 text-xs text-text-secondary">Primary contact email</p>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">Maintenance Mode</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setForm((p) => ({ ...p, maintenanceMode: "off" }))}
                  className={`flex-1 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.maintenanceMode === "off"
                      ? "border-success bg-[rgba(16,185,129,0.1)] text-success"
                      : "border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.30)] text-text-secondary hover:border-[rgba(255,255,255,0.50)]"
                  }`}
                >
                  Site Active
                </button>
                <button
                  onClick={() => setForm((p) => ({ ...p, maintenanceMode: "on" }))}
                  className={`flex-1 p-4 rounded-xl border-2 text-sm font-medium transition-all ${
                    form.maintenanceMode === "on"
                      ? "border-warning bg-[rgba(245,158,11,0.1)] text-warning"
                      : "border-[rgba(255,255,255,0.35)] bg-[rgba(255,255,255,0.30)] text-text-secondary hover:border-[rgba(255,255,255,0.50)]"
                  }`}
                >
                  Maintenance Mode
                </button>
              </div>
              <p className="mt-2 text-xs text-text-secondary">When enabled, only admins can access the site</p>
            </div>
          </div>
        </Card>

        {/* Security Settings */}
        <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="p-6 border-b border-[rgba(255,255,255,0.35)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(239,68,68,0.15)] flex items-center justify-center">
                <Shield className="w-5 h-5 text-error" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Security</h3>
                <p className="text-sm text-text-secondary">Access and permissions</p>
              </div>
            </div>
          </div>
          <div className="p-6">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.30)]">
              <div>
                <p className="text-sm font-medium text-text-primary">Two-Factor Authentication</p>
                <p className="text-xs text-text-secondary">Add extra security to admin accounts</p>
              </div>
              <Button variant="outline" size="sm">Configure</Button>
            </div>
          </div>
        </Card>

        {/* Notifications */}
        <Card variant="elevated" className="border border-[rgba(255,255,255,0.35)] shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
          <div className="p-6 border-b border-[rgba(255,255,255,0.35)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[rgba(245,158,11,0.15)] flex items-center justify-center">
                <Bell className="w-5 h-5 text-warning" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-text-primary">Notifications</h3>
                <p className="text-sm text-text-secondary">Admin notification preferences</p>
              </div>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.30)]">
              <div>
                <p className="text-sm font-medium text-text-primary">New Seller Applications</p>
                <p className="text-xs text-text-secondary">Get notified when sellers apply</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-[#429DFE] relative cursor-pointer shadow-sm">
                <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl bg-[rgba(255,255,255,0.30)]">
              <div>
                <p className="text-sm font-medium text-text-primary">Order Updates</p>
                <p className="text-xs text-text-secondary">Get notified on order status changes</p>
              </div>
              <div className="w-12 h-6 rounded-full bg-[#429DFE] relative cursor-pointer shadow-sm">
                <div className="absolute right-1 top-1 w-4 h-4 rounded-full bg-white shadow-sm" />
              </div>
            </div>
          </div>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={save} disabled={!canSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
          <Button variant="outline" onClick={() => setForm(readSettings())}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
}

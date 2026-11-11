"use client";

import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/hooks/useAuth";
import { useMemo, useState } from "react";

export default function AccountSettingsPage() {
  const { user, refresh } = useAuth();
  const { toast } = useToast();

  const [file, setFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const previewUrl = useMemo(() => {
    if (!file) return null;
    return URL.createObjectURL(file);
  }, [file]);

  const save = async () => {
    if (!file) return;
    setIsSaving(true);
    try {
      const form = new FormData();
      form.set("avatar", file);
      const res = await fetch("/api/account/avatar", { method: "POST", body: form });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to upload");
      await refresh();
      setFile(null);
      setFileName(null);
      toast("success", "Profile picture updated");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Failed to upload");
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/account/avatar", { method: "DELETE" });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(json?.error ?? "Failed to remove");
      await refresh();
      setFile(null);
      setFileName(null);
      toast("success", "Profile picture removed");
    } catch (e) {
      toast("error", e instanceof Error ? e.message : "Failed to remove");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-black uppercase tracking-tight">Settings</h2>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-black uppercase tracking-tight">Profile picture</h3>

        <div className="mt-4 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="h-20 w-20 rounded-2xl overflow-hidden bg-[rgba(255,255,255,0.60)] backdrop-blur-lg border border-[rgba(15,23,42,0.10)] shadow-md flex items-center justify-center">
            {previewUrl ? (
              <img src={previewUrl} alt="Profile" className="h-full w-full object-cover" />
            ) : user?.avatar?.url ? (
              <img src={user.avatar.url} alt={user.avatar.alt ?? user.username} className="h-full w-full object-cover" />
            ) : (
              <span className="text-3xl font-black uppercase">{user?.username?.[0] ?? "U"}</span>
            )}
          </div>

          <div className="flex-1 space-y-2">
            <input
              type="file"
              accept="image/*"
              className="block w-full text-sm font-bold"
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                setFile(f);
                setFileName(f?.name ?? null);
              }}
            />
            {fileName ? (
              <p className="text-xs font-bold text-text-secondary uppercase">Selected: {fileName}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={save} disabled={!file || isSaving} isLoading={isSaving}>
              Save
            </Button>
            <Button variant="outline" onClick={remove} disabled={isSaving || (!user?.avatar?.url && !previewUrl)}>
              Remove
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setFile(null);
                setFileName(null);
              }}
              disabled={isSaving}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

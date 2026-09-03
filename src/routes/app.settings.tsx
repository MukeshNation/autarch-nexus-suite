import { useEffect, useRef, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { WorkspacePage } from "@/components/workspace/page";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/use-auth";
import { usePreferences, type PreferenceKey } from "@/hooks/use-preferences";
import { deleteMyAccount, exportMyData } from "@/lib/account.functions";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

const PREFERENCE_ROWS: Array<[PreferenceKey, string, string]> = [
  ["density", "Compact density", "Tighten spacing across the workspace."],
  ["motion", "Reduced motion", "Disable ambient and stroke animations."],
  ["kbdHints", "Keyboard-first", "Show shortcut hints in every panel."],
];

function formatBytes(bytes: number) {
  if (!bytes) return "0 MB";
  const mb = bytes / (1024 * 1024);
  return mb >= 1024 ? `${(mb / 1024).toFixed(2)} GB` : `${mb.toFixed(1)} MB`;
}

function SettingsPage() {
  const { user, profile, subscription, avatarUrl, profileLoading, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { prefs, setPreference } = usePreferences();

  async function onExport() {
    setExporting(true);
    try {
      const data = await exportMyData();
      const blob = new Blob([JSON.stringify(JSON.parse(data.json), null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `autarch-data-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Export downloaded");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Export failed");
    }
    setExporting(false);
  }

  async function onDeleteAccount() {
    if (!window.confirm("Permanently delete your Autarch account and all of its data?")) return;
    setDeleting(true);
    try {
      await deleteMyAccount();
      await queryClient.cancelQueries();
      queryClient.clear();
      await signOut();
      toast.success("Account deleted");
      await navigate({ to: "/", replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Deletion failed");
    }
    setDeleting(false);
  }


  useEffect(() => {
    setDisplayName(profile?.display_name ?? profile?.full_name ?? "");
    setPhone(profile?.phone ?? "");
  }, [profile?.display_name, profile?.full_name, profile?.phone]);

  async function onSave(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user) return;
    if (displayName.trim().length < 2) {
      toast.error("Display name must be at least 2 characters");
      return;
    }
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ display_name: displayName.trim(), full_name: displayName.trim(), phone: phone.trim() || null })
      .eq("id", user.id);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Profile updated");
  }

  async function onAvatarPicked(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Avatar must be under 5 MB");
      return;
    }
    setUploading(true);
    const path = `${user.id}/avatar-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const upload = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (upload.error) {
      setUploading(false);
      toast.error(upload.error.message);
      return;
    }
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", user.id);
    setUploading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    await refreshProfile();
    toast.success("Avatar updated");
  }

  async function onSignOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await signOut();
    await navigate({ to: "/login", replace: true });
  }

  return (
    <WorkspacePage title="Settings" lead="Profile, workspace preferences, privacy and data controls.">
      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList className="font-mono text-xs">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="panel mt-4 space-y-4 p-5">
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              {avatarUrl ? <AvatarImage src={avatarUrl} alt="" /> : null}
              <AvatarFallback className="font-mono text-xs">
                {(displayName || user?.email || "A").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <Button
                type="button"
                size="sm"
                variant="outline"
                className="font-mono text-[0.7rem]"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
              >
                {uploading ? "Uploading…" : "Change avatar"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => void onAvatarPicked(e)}
              />
              <p className="mt-1 font-mono text-[0.62rem] text-muted-foreground">PNG or JPG, up to 5 MB.</p>
            </div>
          </div>

          <form className="space-y-3" onSubmit={onSave}>
            <div>
              <Label htmlFor="s-name" className="label-mono">
                Display name
              </Label>
              <Input
                id="s-name"
                className="mt-1.5 font-mono text-xs"
                placeholder="Your name"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="s-phone" className="label-mono">
                Phone
              </Label>
              <Input
                id="s-phone"
                type="tel"
                className="mt-1.5 font-mono text-xs"
                placeholder="+91 90000 00000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="s-email" className="label-mono">
                Email
              </Label>
              <Input
                id="s-email"
                type="email"
                readOnly
                className="mt-1.5 font-mono text-xs text-muted-foreground"
                value={user?.email ?? ""}
              />
            </div>
            <Button type="submit" className="font-mono text-xs" disabled={saving || profileLoading}>
              {saving ? "Saving…" : "Save profile"}
            </Button>
          </form>

          <div className="grid gap-2 border-t border-border pt-4 sm:grid-cols-3">
            <div>
              <span className="label-mono block">Plan</span>
              <span className="font-mono text-xs">
                {subscription?.plan ?? profile?.plan ?? "free"} · {subscription?.status ?? "active"}
              </span>
            </div>
            <div>
              <span className="label-mono block">Credits</span>
              <span className="font-mono text-xs">{profile?.credit_balance ?? 0}</span>
            </div>
            <div>
              <span className="label-mono block">Storage used</span>
              <span className="font-mono text-xs">{formatBytes(profile?.storage_used_bytes ?? 0)}</span>
            </div>
          </div>

          <div className="border-t border-border pt-4">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="font-mono text-[0.7rem]"
              onClick={() => void onSignOut()}
            >
              Sign out
            </Button>
          </div>
        </TabsContent>


        <TabsContent value="preferences" className="panel mt-4 space-y-4 p-5">
          {PREFERENCE_ROWS.map(([key, title, detail]) => (
            <div key={key} className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <span className="block text-xs">{title}</span>
                <span className="block text-[0.7rem] text-muted-foreground">{detail}</span>
              </div>
              <Switch
                checked={prefs[key]}
                onCheckedChange={(checked) => setPreference(key, checked)}
                aria-label={title}
              />
            </div>
          ))}
          <p className="font-mono text-[0.62rem] text-muted-foreground">
            Saved on this device and applied instantly across the workspace.
          </p>
        </TabsContent>

        <TabsContent value="privacy" className="panel mt-4 space-y-4 p-5 text-xs text-muted-foreground">
          <p>
            Your files and generations belong to you. Autarch does not train on your content. Export a full copy of your
            workspace data, or delete your account and everything attached to it.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-[0.7rem]"
              disabled={exporting || !user}
              onClick={() => void onExport()}
            >
              {exporting ? "Preparing…" : "Export data"}
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="font-mono text-[0.7rem] text-destructive"
              disabled={deleting || !user}
              onClick={() => void onDeleteAccount()}
            >
              {deleting ? "Deleting…" : "Delete account"}
            </Button>
          </div>
          <p className="font-mono text-[0.62rem]">
            Deletion is permanent: profile, workspaces, projects, tasks, files and AI history are removed.
          </p>
        </TabsContent>
      </Tabs>
    </WorkspacePage>
  );
}

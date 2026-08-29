import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <WorkspacePage title="Settings" lead="Profile, workspace preferences, privacy and data controls.">
      <Tabs defaultValue="profile" className="max-w-2xl">
        <TabsList className="font-mono text-xs">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="panel mt-4 space-y-3 p-5">
          <div>
            <Label htmlFor="s-name" className="label-mono">
              Display name
            </Label>
            <Input id="s-name" className="mt-1.5 font-mono text-xs" placeholder="Your name" />
          </div>
          <div>
            <Label htmlFor="s-email" className="label-mono">
              Email
            </Label>
            <Input id="s-email" type="email" className="mt-1.5 font-mono text-xs" placeholder="you@company.com" />
          </div>
          <Button className="font-mono text-xs" disabled>
            Save (requires accounts)
          </Button>
        </TabsContent>

        <TabsContent value="preferences" className="panel mt-4 space-y-4 p-5">
          {[
            ["Compact density", "Tighten spacing across the workspace."],
            ["Reduced motion", "Disable ambient and stroke animations."],
            ["Keyboard-first", "Show shortcut hints in every panel."],
          ].map(([title, detail]) => (
            <div key={title} className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <span className="block text-xs">{title}</span>
                <span className="block text-[0.7rem] text-muted-foreground">{detail}</span>
              </div>
              <Switch />
            </div>
          ))}
        </TabsContent>

        <TabsContent value="privacy" className="panel mt-4 space-y-4 p-5 text-xs text-muted-foreground">
          <p>
            Your files and generations belong to you. Autarch does not train on your content. You can export or delete
            your workspace data at any time once storage is connected.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="font-mono text-[0.7rem]" disabled>
              Export data
            </Button>
            <Button size="sm" variant="outline" className="font-mono text-[0.7rem]" disabled>
              Delete account
            </Button>
          </div>
        </TabsContent>
      </Tabs>
    </WorkspacePage>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { WorkspacePage } from "@/components/workspace/page";
import { DemoDataBadge } from "@/components/autarch/status-badge";
import { DEMO_PROJECTS, DEMO_FILES, DEMO_GENERATIONS } from "@/lib/demo-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/projects")({
  component: ProjectsPage,
});

function ProjectsPage() {
  return (
    <WorkspacePage
      title="Projects"
      lead="Every generated asset, task and file belongs to a project. This is the workspace memory."
      actions={<DemoDataBadge />}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          {DEMO_PROJECTS.map((p) => (
            <article key={p.id} className="panel p-4">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-sm">{p.name}</h2>
                <span className="label-mono">{p.category}</span>
                <span className="label-mono ml-auto">Due {p.deadline}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted-foreground">{p.description}</p>
              <div className="mt-3 flex items-center gap-3">
                <Progress value={p.progress} className="h-1 flex-1" />
                <span className="font-mono text-[0.65rem] text-muted-foreground">
                  {p.priority} · {p.assets} assets
                </span>
              </div>

              <Tabs defaultValue="overview" className="mt-4">
                <TabsList className="font-mono text-[0.65rem]">
                  {["overview", "tasks", "files", "activity", "assets", "history"].map((t) => (
                    <TabsTrigger key={t} value={t} className="text-[0.65rem] capitalize">
                      {t}
                    </TabsTrigger>
                  ))}
                </TabsList>
                <TabsContent value="overview" className="pt-3 text-xs text-muted-foreground">
                  {p.progress}% complete · priority {p.priority} · category {p.category}.
                </TabsContent>
                <TabsContent value="tasks" className="pt-3 text-xs text-muted-foreground">
                  Task board lives under Tasks, filtered to this project.
                </TabsContent>
                <TabsContent value="files" className="pt-3">
                  <ul className="space-y-1 font-mono text-[0.68rem] text-muted-foreground">
                    {DEMO_FILES.filter((f) => f.project === p.name).map((f) => (
                      <li key={f.name}>
                        {f.name} · {f.size}
                      </li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="activity" className="pt-3 text-xs text-muted-foreground">
                  AI activity for this project appears here once execution is connected.
                </TabsContent>
                <TabsContent value="assets" className="pt-3">
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {DEMO_GENERATIONS.slice(0, 3).map((g) => (
                      <li key={g.title}>{g.title}</li>
                    ))}
                  </ul>
                </TabsContent>
                <TabsContent value="history" className="pt-3 text-xs text-muted-foreground">
                  Immutable record of every run attached to this project.
                </TabsContent>
              </Tabs>
            </article>
          ))}
        </div>

        <form
          className="panel h-fit p-5"
          onSubmit={(e) => {
            e.preventDefault();
          }}
        >
          <span className="label-mono">New project</span>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="p-name" className="label-mono">
                Project name
              </Label>
              <Input id="p-name" className="mt-1.5 font-mono text-xs" placeholder="Atlas Relaunch" />
            </div>
            <div>
              <Label htmlFor="p-desc" className="label-mono">
                Description
              </Label>
              <Textarea id="p-desc" rows={3} className="mt-1.5 font-mono text-xs" placeholder="What is this project for?" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="p-priority" className="label-mono">
                  Priority
                </Label>
                <Input id="p-priority" className="mt-1.5 font-mono text-xs" placeholder="High" />
              </div>
              <div>
                <Label htmlFor="p-category" className="label-mono">
                  Category
                </Label>
                <Input id="p-category" className="mt-1.5 font-mono text-xs" placeholder="Marketing" />
              </div>
            </div>
            <div>
              <Label htmlFor="p-deadline" className="label-mono">
                Deadline
              </Label>
              <Input id="p-deadline" type="date" className="mt-1.5 font-mono text-xs" />
            </div>
            <Button type="submit" className="w-full font-mono text-xs">
              Create project
            </Button>
            <p className="font-mono text-[0.62rem] text-muted-foreground">
              Persistence arrives with the database phase.
            </p>
          </div>
        </form>
      </div>
    </WorkspacePage>
  );
}

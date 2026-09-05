import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { WorkspacePage } from "@/components/workspace/page";
import {
  formatDate,
  useCreateProject,
  useDeleteProject,
  useFiles,
  useProjects,
  useTasks,
  useUpdateProject,
} from "@/lib/workspace-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/projects")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: ProjectsPage,
});

function ProjectsPage() {
  const projects = useProjects();
  const tasks = useTasks();
  const files = useFiles();
  const createProject = useCreateProject();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();

  const [form, setForm] = useState({ name: "", description: "", priority: "high", category: "", deadline: "" });

  const stats = useMemo(() => {
    const map = new Map<string, { total: number; done: number; files: number }>();
    for (const p of projects.data ?? []) map.set(p.id, { total: 0, done: 0, files: 0 });
    for (const t of tasks.data ?? []) {
      if (!t.project_id) continue;
      const entry = map.get(t.project_id);
      if (!entry) continue;
      entry.total += 1;
      if (t.status === "done") entry.done += 1;
    }
    for (const f of files.data ?? []) {
      if (!f.project_id) continue;
      const entry = map.get(f.project_id);
      if (entry) entry.files += 1;
    }
    return map;
  }, [projects.data, tasks.data, files.data]);

  return (
    <WorkspacePage
      title="Projects"
      lead="Every generated asset, task and file belongs to a project. This is the workspace memory."
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <div className="space-y-3">
          {projects.isLoading && <Skeleton className="h-32 w-full" />}
          {projects.error && (
            <p className="panel p-4 text-xs text-destructive">Could not load your projects. Please refresh.</p>
          )}
          {projects.data?.length === 0 && (
            <p className="panel border-dashed p-8 text-center font-mono text-xs text-muted-foreground">
              No projects yet. Create your first project on the right.
            </p>
          )}

          {(projects.data ?? []).map((p) => {
            const s = stats.get(p.id) ?? { total: 0, done: 0, files: 0 };
            const progress = s.total ? Math.round((s.done / s.total) * 100) : 0;
            const projectTasks = (tasks.data ?? []).filter((t) => t.project_id === p.id);
            const projectFiles = (files.data ?? []).filter((f) => f.project_id === p.id);
            return (
              <article key={p.id} className="panel p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-sm">{p.name}</h2>
                  {p.category && <span className="label-mono">{p.category}</span>}
                  <span className="label-mono ml-auto">Due {formatDate(p.deadline)}</span>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    title="Delete project"
                    onClick={() => {
                      if (!window.confirm(`Delete “${p.name}”? Tasks and file records are removed too.`)) return;
                      deleteProject.mutate(p.id, {
                        onSuccess: () => toast.success("Project deleted"),
                        onError: (e) => toast.error(e.message),
                      });
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
                {p.description && <p className="mt-1.5 text-xs text-muted-foreground">{p.description}</p>}
                <div className="mt-3 flex items-center gap-3">
                  <Progress value={progress} className="h-1 flex-1" />
                  <span className="font-mono text-[0.65rem] text-muted-foreground">
                    {p.priority} · {s.files} files · {s.done}/{s.total} tasks
                  </span>
                </div>

                <Tabs defaultValue="overview" className="mt-4">
                  <TabsList className="font-mono text-[0.65rem]">
                    {["overview", "tasks", "files", "status"].map((t) => (
                      <TabsTrigger key={t} value={t} className="text-[0.65rem] capitalize">
                        {t}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value="overview" className="pt-3 text-xs text-muted-foreground">
                    {progress}% complete · priority {p.priority} · created {formatDate(p.created_at)}.
                  </TabsContent>
                  <TabsContent value="tasks" className="pt-3">
                    <ul className="space-y-1 text-xs text-muted-foreground">
                      {projectTasks.map((t) => (
                        <li key={t.id}>
                          {t.title} · {t.status}
                        </li>
                      ))}
                      {projectTasks.length === 0 && <li>No tasks linked yet.</li>}
                    </ul>
                  </TabsContent>
                  <TabsContent value="files" className="pt-3">
                    <ul className="space-y-1 font-mono text-[0.68rem] text-muted-foreground">
                      {projectFiles.map((f) => (
                        <li key={f.id}>{f.file_name}</li>
                      ))}
                      {projectFiles.length === 0 && <li>No files uploaded yet.</li>}
                    </ul>
                  </TabsContent>
                  <TabsContent value="status" className="pt-3">
                    <div className="flex flex-wrap items-center gap-2">
                      {["active", "paused", "completed"].map((status) => (
                        <Button
                          key={status}
                          size="sm"
                          variant={p.status === status ? "default" : "outline"}
                          className="font-mono text-[0.65rem] capitalize"
                          onClick={() =>
                            updateProject.mutate(
                              { id: p.id, patch: { status } },
                              { onError: (e) => toast.error(e.message) },
                            )
                          }
                        >
                          {status}
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </article>
            );
          })}
        </div>

        <form
          className="panel h-fit p-5"
          onSubmit={(e) => {
            e.preventDefault();
            if (!form.name.trim()) {
              toast.error("Give the project a name.");
              return;
            }
            createProject.mutate(
              {
                name: form.name.trim(),
                description: form.description.trim() || null,
                category: form.category.trim() || null,
                priority: form.priority || "medium",
                deadline: form.deadline ? new Date(form.deadline).toISOString() : null,
              },
              {
                onSuccess: () => {
                  toast.success("Project created");
                  setForm({ name: "", description: "", priority: "high", category: "", deadline: "" });
                },
                onError: (err) => toast.error(err.message),
              },
            );
          }}
        >
          <span className="label-mono">New project</span>
          <div className="mt-4 space-y-3">
            <div>
              <Label htmlFor="p-name" className="label-mono">
                Project name
              </Label>
              <Input
                id="p-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="mt-1.5 font-mono text-xs"
                placeholder="Atlas Relaunch"
              />
            </div>
            <div>
              <Label htmlFor="p-desc" className="label-mono">
                Description
              </Label>
              <Textarea
                id="p-desc"
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="mt-1.5 font-mono text-xs"
                placeholder="What is this project for?"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="p-priority" className="label-mono">
                  Priority
                </Label>
                <Input
                  id="p-priority"
                  value={form.priority}
                  onChange={(e) => setForm({ ...form, priority: e.target.value })}
                  className="mt-1.5 font-mono text-xs"
                  placeholder="high"
                />
              </div>
              <div>
                <Label htmlFor="p-category" className="label-mono">
                  Category
                </Label>
                <Input
                  id="p-category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="mt-1.5 font-mono text-xs"
                  placeholder="Marketing"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="p-deadline" className="label-mono">
                Deadline
              </Label>
              <Input
                id="p-deadline"
                type="date"
                value={form.deadline}
                onChange={(e) => setForm({ ...form, deadline: e.target.value })}
                className="mt-1.5 font-mono text-xs"
              />
            </div>
            <Button type="submit" disabled={createProject.isPending} className="w-full font-mono text-xs">
              {createProject.isPending ? "Creating…" : "Create project"}
            </Button>
          </div>
        </form>
      </div>
    </WorkspacePage>
  );
}

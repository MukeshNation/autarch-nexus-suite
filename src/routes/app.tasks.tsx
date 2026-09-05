import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";
import { WorkspacePage } from "@/components/workspace/page";
import { useCreateTask, useDeleteTask, useProjects, useTasks, useUpdateTask } from "@/lib/workspace-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/app/tasks")({
  head: () => ({ meta: [{ name: "robots", content: "noindex" }] }),
  component: TasksPage,
});

const COLUMNS = [
  { id: "backlog", label: "Backlog" },
  { id: "todo", label: "Todo" },
  { id: "in_progress", label: "In Progress" },
  { id: "done", label: "Done" },
] as const;

const PRIORITY_ORDER: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };

function TasksPage() {
  const tasks = useTasks();
  const projects = useProjects();
  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [title, setTitle] = useState("");
  const [projectId, setProjectId] = useState<string>("none");
  const [priority, setPriority] = useState("medium");
  const [filterProject, setFilterProject] = useState<string>("all");
  const [sort, setSort] = useState<"created" | "priority" | "deadline">("created");

  const projectName = (id: string | null) =>
    (projects.data ?? []).find((p) => p.id === id)?.name ?? "Unfiled";

  const visible = useMemo(() => {
    let list = [...(tasks.data ?? [])];
    if (filterProject !== "all") list = list.filter((t) => (t.project_id ?? "none") === filterProject);
    if (sort === "priority")
      list.sort((a, b) => (PRIORITY_ORDER[a.priority] ?? 9) - (PRIORITY_ORDER[b.priority] ?? 9));
    if (sort === "deadline")
      list.sort((a, b) => (a.deadline ?? "9999").localeCompare(b.deadline ?? "9999"));
    return list;
  }, [tasks.data, filterProject, sort]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Give the task a title.");
      return;
    }
    createTask.mutate(
      {
        title: title.trim(),
        project_id: projectId === "none" ? null : projectId,
        priority,
        status: "todo",
      },
      {
        onSuccess: () => {
          setTitle("");
          toast.success("Task added");
        },
        onError: (err) => toast.error(err.message),
      },
    );
  };

  return (
    <WorkspacePage title="Tasks" lead="Kanban and list views over every project task.">
      <form onSubmit={submit} className="panel mb-4 flex flex-wrap items-end gap-2 p-3">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New task…"
          className="h-8 min-w-48 flex-1 font-mono text-xs"
        />
        <Select value={projectId} onValueChange={setProjectId}>
          <SelectTrigger className="h-8 w-40 font-mono text-xs">
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Unfiled</SelectItem>
            {(projects.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="h-8 w-32 font-mono text-xs">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            {["urgent", "high", "medium", "low"].map((p) => (
              <SelectItem key={p} value={p}>
                {p}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button type="submit" size="sm" disabled={createTask.isPending} className="h-8 font-mono text-xs">
          Add task
        </Button>
      </form>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={filterProject} onValueChange={setFilterProject}>
          <SelectTrigger className="h-8 w-44 font-mono text-xs">
            <SelectValue placeholder="Filter project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            <SelectItem value="none">Unfiled</SelectItem>
            {(projects.data ?? []).map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="h-8 w-40 font-mono text-xs">
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created">Newest first</SelectItem>
            <SelectItem value="priority">By priority</SelectItem>
            <SelectItem value="deadline">By deadline</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {tasks.isLoading && <Skeleton className="h-40 w-full" />}
      {tasks.error && <p className="panel p-4 text-xs text-destructive">Could not load your tasks.</p>}

      <Tabs defaultValue="board">
        <TabsList className="font-mono text-xs">
          <TabsTrigger value="board">Board</TabsTrigger>
          <TabsTrigger value="list">List</TabsTrigger>
        </TabsList>

        <TabsContent value="board" className="pt-4">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {COLUMNS.map((col) => {
              const items = visible.filter((t) => t.status === col.id);
              return (
                <section
                  key={col.id}
                  className="panel p-3"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("text/task-id");
                    if (id) updateTask.mutate({ id, patch: { status: col.id } });
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className="label-mono">{col.label}</span>
                    <span className="label-mono ml-auto">{items.length}</span>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {items.map((t) => (
                      <li
                        key={t.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/task-id", t.id)}
                        className="hover-lift cursor-grab rounded-md border border-border px-3 py-2"
                      >
                        <span className="block text-xs">{t.title}</span>
                        <span className="label-mono mt-1 block">
                          {projectName(t.project_id)} · {t.priority}
                        </span>
                      </li>
                    ))}
                    {items.length === 0 && (
                      <li className="rounded-md border border-dashed border-border px-3 py-6 text-center font-mono text-[0.65rem] text-muted-foreground">
                        Empty
                      </li>
                    )}
                  </ul>
                </section>
              );
            })}
          </div>
          <p className="mt-2 font-mono text-[0.62rem] text-muted-foreground">Drag a card between columns to change its status.</p>
        </TabsContent>

        <TabsContent value="list" className="pt-4">
          <div className="panel overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  {["Task", "Project", "Status", "Priority", ""].map((h) => (
                    <th key={h} className="label-mono px-3 py-2 font-normal">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visible.map((t) => (
                  <tr key={t.id} className="border-b border-border last:border-0">
                    <td className="px-3 py-2">{t.title}</td>
                    <td className="px-3 py-2 text-muted-foreground">{projectName(t.project_id)}</td>
                    <td className="px-3 py-2">
                      <Select
                        value={t.status}
                        onValueChange={(v) => updateTask.mutate({ id: t.id, patch: { status: v } })}
                      >
                        <SelectTrigger className="h-7 w-32 font-mono text-[0.68rem]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {COLUMNS.map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </td>
                    <td className="px-3 py-2 font-mono text-[0.68rem]">{t.priority}</td>
                    <td className="px-3 py-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-7"
                        title="Delete task"
                        onClick={() => deleteTask.mutate(t.id, { onError: (e) => toast.error(e.message) })}
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))}
                {visible.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center font-mono text-[0.7rem] text-muted-foreground">
                      No tasks yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </WorkspacePage>
  );
}
